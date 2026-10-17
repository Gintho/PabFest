/**
 * Mémoire d'idempotence : retient les clés déjà traitées pendant `ttlMs`.
 *
 * Limite v1 (pas de base de données) : la mémoire est propre à chaque instance
 * serverless. Un rejeu atteignant une autre instance peut produire une seconde
 * ligne de log « donation_confirmed » portant le même checkoutIntentId : les
 * consommateurs des logs doivent dédoublonner sur ce champ. Pour une garantie
 * globale, brancher un store partagé (SET NX) à la place de ce module.
 */

export function createIdempotencyStore(ttlMs = 24 * 60 * 60 * 1000, maxKeys = 50_000) {
  const seen = new Map<string, number>();

  return {
    /** true si la clé est nouvelle (et la marque comme traitée), false si déjà vue. */
    claim(key: string, now = Date.now()): boolean {
      const at = seen.get(key);
      if (at !== undefined && now - at < ttlMs) return false;
      seen.set(key, now);
      if (seen.size > maxKeys) seen.delete(seen.keys().next().value as string);
      return true;
    },
    /** Libère une clé si le traitement a échoué, pour qu'un rejeu puisse réessayer. */
    release(key: string) {
      seen.delete(key);
    },
  };
}

export const processedDonations = createIdempotencyStore();
