import { errorInfo, log } from "./log";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Vérifie un jeton Cloudflare Turnstile côté serveur. */
export async function verifyTurnstile(secret: string, token: string | undefined, ip: string) {
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip !== "unknown") body.set("remoteip", ip);
    const res = await fetch(VERIFY_URL, { method: "POST", body, signal: AbortSignal.timeout(5000) });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    log.warn("turnstile_verify_failed", errorInfo(err));
    return false;
  }
}
