/**
 * Journalisation structurée (une ligne JSON par événement, lisible dans les
 * logs Vercel). Garde-fou : toute clé ressemblant à une donnée personnelle ou
 * à un secret est masquée, même si un appelant la transmet par erreur.
 */

type Level = "info" | "warn" | "error";
type Fields = Record<string, unknown>;

const SENSITIVE_KEY =
  /(e-?mail|name|nom|prenom|address|adresse|zip|city|ville|phone|siren|siret|birth|token|secret|password|authorization|card|iban|payer|redirect)/i;

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[depth]";
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Fields = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SENSITIVE_KEY.test(k) ? "[redacted]" : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

function write(level: Level, event: string, fields: Fields = {}) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...(redact(fields) as Fields) });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  info: (event: string, fields?: Fields) => write("info", event, fields),
  warn: (event: string, fields?: Fields) => write("warn", event, fields),
  error: (event: string, fields?: Fields) => write("error", event, fields),
};

/** Résumé d'erreur sûr pour les logs (pas de stack contenant des payloads). */
export function errorInfo(err: unknown): Fields {
  if (err instanceof Error) return { errorType: err.name, errorMessage: err.message.slice(0, 300) };
  return { errorMessage: String(err).slice(0, 300) };
}
