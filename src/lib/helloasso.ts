import { getEnv } from "./env";
import { errorInfo, log } from "./log";
import type { DonationInput } from "./schema";
import { site } from "@/config/site";

/**
 * Client HelloAsso API v5 (Checkout).
 * Champs et endpoints validés contre l'OpenAPI v5 (SDK officiels HelloAsso) :
 *  - POST /oauth2/token (client_credentials)
 *  - POST /v5/organizations/{slug}/checkout-intents   (InitCheckoutBody)
 *  - GET  /v5/organizations/{slug}/checkout-intents/{id} (CheckoutIntentResponse)
 */

const TIMEOUT_MS = 10_000;
/** Marqueur posé dans les metadata pour reconnaître les intentions créées par ce site. */
export const METADATA_SOURCE = "onepage-mecenat";

export class HelloAssoError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "HelloAssoError";
  }
}

// ─── OAuth2 ────────────────────────────────────────────────────────────────

let tokenCache: { token: string; expiresAt: number } | null = null;
let inflight: Promise<string> | null = null;

export function resetTokenCache() {
  tokenCache = null;
  inflight = null;
}

async function fetchToken(): Promise<string> {
  const env = getEnv();
  const res = await fetch(`${env.apiBaseUrl}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.HELLOASSO_CLIENT_ID,
      client_secret: env.HELLOASSO_CLIENT_SECRET,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new HelloAssoError("oauth_token_failed", res.status);
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new HelloAssoError("oauth_token_missing");
  const ttlSec = typeof data.expires_in === "number" ? data.expires_in : 1800;
  // Renouvelle 60 s avant l'expiration annoncée.
  tokenCache = { token: data.access_token, expiresAt: Date.now() + Math.max(ttlSec - 60, 30) * 1000 };
  return data.access_token;
}

export async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.token;
  // Mutualise les demandes concurrentes de jeton.
  inflight ??= fetchToken().finally(() => {
    inflight = null;
  });
  return inflight;
}

async function apiFetch(path: string, init: RequestInit = {}, retried = false): Promise<Response> {
  const env = getEnv();
  const token = await getAccessToken();
  const res = await fetch(`${env.apiBaseUrl}/v5${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (res.status === 401 && !retried) {
    tokenCache = null;
    return apiFetch(path, init, true);
  }
  return res;
}

// ─── Checkout intent ───────────────────────────────────────────────────────

export interface DonationMetadata {
  source: typeof METADATA_SOURCE;
  ref: string;
  donorType: "company" | "individual";
  amountCents: number;
  siren?: string;
}

export function buildCheckoutBody(input: DonationInput, ref: string) {
  const env = getEnv();
  const { donor, amountCents } = input;

  // URLs construites exclusivement depuis SITE_URL (jamais depuis l'entrée utilisateur).
  const backUrl = `${env.SITE_URL}/?retour=annule`;
  const errorUrl = `${env.SITE_URL}/erreur`;
  const returnUrl = `${env.SITE_URL}/merci`;

  const metadata: DonationMetadata = {
    source: METADATA_SOURCE,
    ref,
    donorType: donor.donorType,
    amountCents,
    // Pas de champ SIREN dans CheckoutPayer : transmis en metadata (donnée publique d'entreprise).
    ...(donor.donorType === "company" && donor.siren ? { siren: donor.siren } : {}),
  };

  return {
    totalAmount: amountCents,
    initialAmount: amountCents,
    itemName: site.itemName[donor.donorType].slice(0, 250),
    backUrl,
    errorUrl,
    returnUrl,
    containsDonation: true,
    payer: {
      firstName: donor.firstName,
      lastName: donor.lastName,
      email: donor.email,
      address: donor.address,
      city: donor.city,
      zipCode: donor.zipCode,
      country: donor.country,
      ...(donor.donorType === "company" ? { companyName: donor.companyName } : {}),
    },
    metadata,
  };
}

export async function createCheckoutIntent(input: DonationInput, ref: string) {
  const env = getEnv();
  const res = await apiFetch(`/organizations/${encodeURIComponent(env.HELLOASSO_ORG_SLUG)}/checkout-intents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildCheckoutBody(input, ref)),
  });
  if (!res.ok) {
    // Corps d'erreur HelloAsso journalisé tronqué ; il ne contient pas de secret,
    // mais peut citer des champs saisis : on ne garde que les clés d'erreur.
    let detail: unknown = undefined;
    try {
      const body = (await res.json()) as { errors?: { code?: string; message?: string }[] };
      detail = body.errors?.map((e) => e.code ?? "unknown");
    } catch {
      /* corps non JSON */
    }
    log.error("helloasso_checkout_create_failed", { status: res.status, ref, errorCodes: detail });
    throw new HelloAssoError("checkout_create_failed", res.status);
  }
  const data = (await res.json()) as { id?: number; redirectUrl?: string };
  if (!data.id || !data.redirectUrl) throw new HelloAssoError("checkout_response_invalid");
  assertHelloAssoRedirect(data.redirectUrl);
  return { id: data.id, redirectUrl: data.redirectUrl };
}

/** Garde-fou : on ne redirige le donateur que vers un domaine HelloAsso en HTTPS. */
export function assertHelloAssoRedirect(url: string) {
  const u = new URL(url);
  const okHost = u.hostname === "helloasso.com" || u.hostname.endsWith(".helloasso.com") ||
    u.hostname === "helloasso-sandbox.com" || u.hostname.endsWith(".helloasso-sandbox.com");
  if (u.protocol !== "https:" || !okHost) throw new HelloAssoError("unexpected_redirect_host");
}

// ─── Lecture et interprétation du statut ───────────────────────────────────

export interface CheckoutIntentPayment {
  id?: number;
  amount?: number;
  state?: string;
}

export interface CheckoutIntent {
  id?: number;
  metadata?: Partial<DonationMetadata> & Record<string, unknown>;
  order?: {
    id?: number;
    checkoutIntentId?: number;
    amount?: { total?: number };
    payments?: CheckoutIntentPayment[];
  };
}

export async function getCheckoutIntent(id: number): Promise<CheckoutIntent | null> {
  const env = getEnv();
  const res = await apiFetch(
    `/organizations/${encodeURIComponent(env.HELLOASSO_ORG_SLUG)}/checkout-intents/${id}`,
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new HelloAssoError("checkout_get_failed", res.status);
  return (await res.json()) as CheckoutIntent;
}

export type DonationStatus = "confirmed" | "pending" | "refused" | "unknown";

const FAILED_STATES = new Set(["Refused", "Canceled", "Abandoned", "Error"]);

/**
 * Seul un paiement « Authorized » dont le montant correspond à celui que ce
 * serveur a demandé (metadata) vaut confirmation. Tout le reste est « en cours »
 * ou « refusé ».
 */
export function evaluateIntent(intent: CheckoutIntent | null): {
  status: DonationStatus;
  amountCents?: number;
  orderId?: number;
  donorType?: string;
} {
  if (!intent) return { status: "unknown" };
  const meta = intent.metadata;
  if (meta?.source !== METADATA_SOURCE || typeof meta.amountCents !== "number") {
    return { status: "unknown" };
  }
  const expected = meta.amountCents;
  const order = intent.order;
  if (!order) return { status: "pending", amountCents: expected };

  const payments = order.payments ?? [];
  const authorized = payments.filter((p) => p.state === "Authorized");
  const authorizedTotal = authorized.reduce((s, p) => s + (p.amount ?? 0), 0);

  if (authorized.length > 0 && order.amount?.total === expected && authorizedTotal >= expected) {
    return { status: "confirmed", amountCents: expected, orderId: order.id, donorType: meta.donorType };
  }
  if (authorized.length > 0) {
    // Paiement autorisé mais montant incohérent : ne jamais confirmer.
    log.error("helloasso_amount_mismatch", {
      checkoutIntentId: intent.id,
      expected,
      orderTotal: order.amount?.total,
      authorizedTotal,
    });
    return { status: "unknown" };
  }
  if (payments.length > 0 && payments.every((p) => FAILED_STATES.has(p.state ?? ""))) {
    return { status: "refused", amountCents: expected };
  }
  return { status: "pending", amountCents: expected };
}

/** Lit et interprète le statut ; renvoie « unknown » en cas d'erreur réseau. */
export async function fetchDonationStatus(id: number) {
  try {
    return { id, ...evaluateIntent(await getCheckoutIntent(id)) };
  } catch (err) {
    log.error("helloasso_status_read_failed", { checkoutIntentId: id, ...errorInfo(err) });
    return { id, status: "unknown" as DonationStatus };
  }
}
