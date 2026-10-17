import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { createCheckoutIntent } from "@/lib/helloasso";
import { GENERIC_ERROR, clientIp, jsonError, readBodyLimited } from "@/lib/http";
import { errorInfo, log } from "@/lib/log";
import { limiters } from "@/lib/ratelimit";
import { buildDonationSchema, fieldErrors } from "@/lib/schema";
import { verifyTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = limiters.checkout(ip);
  if (!rl.ok) {
    log.warn("checkout_rate_limited");
    return jsonError(429, "Trop de tentatives. Merci de patienter une minute.", {
      "Retry-After": String(rl.retryAfterSec),
    });
  }

  let env;
  try {
    env = getEnv();
  } catch (err) {
    log.error("config_invalid", errorInfo(err));
    return jsonError(500, GENERIC_ERROR);
  }

  // Anti-CSRF léger : la requête doit provenir de notre propre origine.
  const origin = req.headers.get("origin");
  if (origin !== new URL(env.SITE_URL).origin) {
    log.warn("checkout_bad_origin");
    return jsonError(403, GENERIC_ERROR);
  }

  const raw = await readBodyLimited(req, 10_000);
  let json: unknown;
  try {
    json = raw === null ? undefined : JSON.parse(raw);
  } catch {
    json = undefined;
  }
  if (json === undefined) return jsonError(400, "Requête invalide.");

  const parsed = buildDonationSchema(env.maxAmountCents).safeParse(json);
  if (!parsed.success) {
    // On ne renvoie que les messages de validation (rédigés par nous), jamais la saisie.
    return NextResponse.json(
      { error: "Certains champs sont invalides.", fields: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }
  const input = parsed.data;

  if (input.website) {
    log.warn("checkout_honeypot_triggered");
    return jsonError(400, GENERIC_ERROR);
  }
  if (env.TURNSTILE_SECRET_KEY && !(await verifyTurnstile(env.TURNSTILE_SECRET_KEY, input.turnstileToken, ip))) {
    log.warn("checkout_turnstile_failed");
    return jsonError(400, "La vérification anti-robot a échoué. Merci de réessayer.");
  }

  const ref = randomUUID();
  try {
    const intent = await createCheckoutIntent(input, ref);
    log.info("checkout_created", {
      ref,
      checkoutIntentId: intent.id,
      amountCents: input.amountCents,
      donorType: input.donor.donorType,
      env: env.HELLOASSO_ENV,
    });
    return NextResponse.json({ redirectUrl: intent.redirectUrl });
  } catch (err) {
    log.error("checkout_failed", { ref, ...errorInfo(err) });
    return jsonError(502, GENERIC_ERROR);
  }
}
