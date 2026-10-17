import { after, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { clientIp, readBodyLimited } from "@/lib/http";
import { errorInfo, log } from "@/lib/log";
import { limiters } from "@/lib/ratelimit";
import { extractCheckoutIntentId, processNotification, verifySignature, verifyUrlToken } from "@/lib/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const unauthorized = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });

export async function POST(req: Request) {
  if (!limiters.webhook(clientIp(req)).ok) {
    log.warn("webhook_rate_limited");
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let env;
  try {
    env = getEnv();
  } catch (err) {
    log.error("config_invalid", errorInfo(err));
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  const token = new URL(req.url).searchParams.get("token");
  if (!verifyUrlToken(token, env.HELLOASSO_WEBHOOK_TOKEN)) {
    log.warn("webhook_bad_token");
    return unauthorized();
  }

  const raw = await readBodyLimited(req, 200_000);
  if (raw === null) return NextResponse.json({ error: "payload_too_large" }, { status: 413 });

  if (env.HELLOASSO_WEBHOOK_SIGNATURE_KEY &&
      !verifySignature(raw, req.headers.get("x-ha-signature"), env.HELLOASSO_WEBHOOK_SIGNATURE_KEY)) {
    log.warn("webhook_bad_signature");
    return unauthorized();
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    log.warn("webhook_invalid_json");
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const eventType = String((payload as { eventType?: unknown })?.eventType ?? "unknown").slice(0, 40);
  const checkoutIntentId = extractCheckoutIntentId(payload);
  if (!checkoutIntentId) {
    // Événement non lié à un checkout (Form, Organization…) : accusé de réception sans effet.
    log.info("webhook_ignored", { eventType });
    return NextResponse.json({ received: true });
  }

  // Réponse immédiate ; la reconfirmation auprès de l'API se fait après l'envoi.
  after(async () => {
    try {
      await processNotification(checkoutIntentId, eventType);
    } catch (err) {
      log.error("webhook_processing_failed", { checkoutIntentId, eventType, ...errorInfo(err) });
    }
  });
  return NextResponse.json({ received: true });
}
