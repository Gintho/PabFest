import { vi } from "vitest";
import { resetEnvCache } from "@/lib/env";
import { resetTokenCache } from "@/lib/helloasso";

export const SITE = "https://dons.example.org";
export const WEBHOOK_TOKEN = "t".repeat(40);
export const SANDBOX = "https://api.helloasso-sandbox.com";

export function setTestEnv(extra: Record<string, string> = {}) {
  Object.assign(process.env, {
    HELLOASSO_CLIENT_ID: "test-client-id",
    HELLOASSO_CLIENT_SECRET: "test-client-secret",
    HELLOASSO_ORG_SLUG: "mon-asso",
    HELLOASSO_ENV: "sandbox",
    SITE_URL: SITE,
    HELLOASSO_WEBHOOK_TOKEN: WEBHOOK_TOKEN,
    HELLOASSO_WEBHOOK_SIGNATURE_KEY: "",
    DONATION_MAX_EUR: "50000",
    TURNSTILE_SITE_KEY: "",
    TURNSTILE_SECRET_KEY: "",
    ...extra,
  });
  resetEnvCache();
  resetTokenCache();
}

export const validCompany = {
  donorType: "company",
  companyName: "ACME SAS",
  siren: "732 829 320",
  firstName: "Camille",
  lastName: "Durand",
  email: "Camille.Durand@Example.com ",
  address: "1 rue de la Paix",
  zipCode: "75002",
  city: "Paris",
  country: "FRA",
};

export const validIndividual = {
  donorType: "individual",
  firstName: "Jean-Pierre",
  lastName: "N'Diaye",
  email: "jp@example.com",
  address: "12 avenue Victor Hugo",
  zipCode: "69003",
  city: "Lyon",
  country: "FRA",
};

type Handler = (url: string, init?: RequestInit) => Response | Promise<Response>;

/** Remplace fetch par un routeur de réponses HelloAsso simulées. */
export function mockFetch(routes: Record<string, Handler>) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fn = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    calls.push({ url, init });
    for (const [prefix, handler] of Object.entries(routes)) {
      if (url.startsWith(prefix)) return handler(url, init);
    }
    throw new Error(`unexpected fetch ${url}`);
  });
  vi.stubGlobal("fetch", fn);
  return { fn, calls };
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export const tokenRoute = {
  [`${SANDBOX}/oauth2/token`]: () => json({ access_token: "access-123", expires_in: 1800, token_type: "bearer" }),
};

export function confirmedIntent(id: number, amountCents: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    metadata: { source: "onepage-mecenat" as const, ref: "r", donorType: "company" as const, amountCents },
    order: {
      id: 9000 + id,
      checkoutIntentId: id,
      amount: { total: amountCents },
      payments: [{ id: 1, amount: amountCents, state: "Authorized" }],
    },
    ...overrides,
  };
}
