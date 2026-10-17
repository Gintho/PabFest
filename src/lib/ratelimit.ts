/**
 * Limiteur de débit à fenêtre glissante, en mémoire.
 *
 * Limite v1 : sur Vercel, chaque instance serverless a sa propre mémoire, la
 * limite est donc « par instance ». C'est un premier rempart ; pour une limite
 * globale, ajoutez une règle Rate Limit dans le Firewall Vercel (voir README)
 * ou remplacez ce module par un store partagé (Upstash/Vercel KV).
 */

export interface RateLimitRule {
  limit: number;
  windowMs: number;
}

export function createRateLimiter({ limit, windowMs }: RateLimitRule, maxKeys = 10_000) {
  const hits = new Map<string, number[]>();

  return function check(key: string, now = Date.now()): { ok: boolean; retryAfterSec: number } {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - recent[0])) / 1000) };
    }
    recent.push(now);
    hits.delete(key); // réinsertion => ordre LRU
    hits.set(key, recent);
    if (hits.size > maxKeys) hits.delete(hits.keys().next().value as string);
    return { ok: true, retryAfterSec: 0 };
  };
}

export const limiters = {
  checkout: createRateLimiter({ limit: 5, windowMs: 60_000 }),
  webhook: createRateLimiter({ limit: 120, windowMs: 60_000 }),
  status: createRateLimiter({ limit: 30, windowMs: 60_000 }),
};
