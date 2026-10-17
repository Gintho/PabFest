import { createHmac, timingSafeEqual } from "node:crypto";
import { fetchDonationStatus } from "./helloasso";
import { processedDonations } from "./idempotency";
import { log } from "./log";

/**
 * Notifications HelloAsso : { eventType: "Order" | "Payment" | "Form" | "Organization", data, metadata? }.
 *
 * Authenticité, par ordre de défense :
 *  1. Jeton secret dans l'URL (?token=…) — obligatoire ;
 *  2. Signature HMAC-SHA256 du corps (en-tête x-ha-signature) — vérifiée si une
 *     clé est configurée (fonctionnalité documentée pour les comptes partenaires) ;
 *  3. Dans tous les cas, le payload n'est JAMAIS cru : on n'en extrait que
 *     l'identifiant d'intention, puis on relit l'état via GET checkout-intents/{id}.
 */

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function verifyUrlToken(received: string | null, expected: string): boolean {
  return typeof received === "string" && safeEqual(received, expected);
}

export function computeSignature(rawBody: string, key: string): string {
  return createHmac("sha256", key).update(rawBody, "utf8").digest("hex");
}

export function verifySignature(rawBody: string, header: string | null, key: string): boolean {
  if (!header) return false;
  const expected = computeSignature(rawBody, key);
  return safeEqual(header.trim().toLowerCase(), expected);
}

/** Extrait l'id d'intention de paiement d'une notification Order ou Payment. */
export function extractCheckoutIntentId(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as { eventType?: unknown; data?: Record<string, unknown> };
  if (p.eventType !== "Order" && p.eventType !== "Payment") return null;
  const data = p.data ?? {};
  const order = (data.order ?? {}) as Record<string, unknown>;
  const candidate = data.checkoutIntentId ?? order.checkoutIntentId;
  const id = typeof candidate === "string" ? Number(candidate) : candidate;
  return Number.isSafeInteger(id) && (id as number) > 0 ? (id as number) : null;
}

/**
 * Traitement asynchrone (après la réponse 200). Idempotent : un même don
 * confirmé ne produit qu'un seul effet, quel que soit le nombre de notifications
 * reçues (rejeu, ou Order + Payment pour le même paiement).
 */
export async function processNotification(checkoutIntentId: number, eventType: string) {
  const result = await fetchDonationStatus(checkoutIntentId);

  if (result.status !== "confirmed") {
    log.info("webhook_not_confirmed", { checkoutIntentId, eventType, status: result.status });
    return result;
  }

  const key = `donation:${checkoutIntentId}`;
  if (!processedDonations.claim(key)) {
    log.info("webhook_duplicate_ignored", { checkoutIntentId, eventType });
    return { ...result, duplicate: true };
  }

  // ✅ Effet unique : journalisation du don confirmé (aucune donnée personnelle).
  log.info("donation_confirmed", {
    checkoutIntentId,
    orderId: result.orderId,
    amountCents: result.amountCents,
    donorType: result.donorType,
    eventType,
  });
  return result;
}
