import { z } from "zod";

/**
 * Variables d'environnement serveur. Ne jamais importer depuis un composant client :
 * aucune de ces valeurs (hors TURNSTILE_SITE_KEY, publique par nature) ne doit
 * atteindre le navigateur.
 */

const optional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

const envSchema = z
  .object({
    HELLOASSO_CLIENT_ID: z.string().min(1),
    HELLOASSO_CLIENT_SECRET: z.string().min(1),
    HELLOASSO_ORG_SLUG: z.string().regex(/^[a-z0-9-]+$/, "slug HelloAsso invalide"),
    HELLOASSO_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
    SITE_URL: z.url().transform((u) => u.replace(/\/+$/, "")),
    HELLOASSO_WEBHOOK_TOKEN: z.string().min(32, "HELLOASSO_WEBHOOK_TOKEN : 32 caractères minimum"),
    HELLOASSO_WEBHOOK_SIGNATURE_KEY: optional,
    DONATION_MAX_EUR: z.coerce.number().int().min(1).max(1_000_000).default(50_000),
    TURNSTILE_SITE_KEY: optional,
    TURNSTILE_SECRET_KEY: optional,
  })
  .superRefine((env, ctx) => {
    const url = new URL(env.SITE_URL);
    if (env.HELLOASSO_ENV === "production" && url.protocol !== "https:") {
      ctx.addIssue({ code: "custom", path: ["SITE_URL"], message: "HTTPS obligatoire en production" });
    }
    if (Boolean(env.TURNSTILE_SITE_KEY) !== Boolean(env.TURNSTILE_SECRET_KEY)) {
      ctx.addIssue({
        code: "custom",
        path: ["TURNSTILE_SECRET_KEY"],
        message: "TURNSTILE_SITE_KEY et TURNSTILE_SECRET_KEY vont ensemble",
      });
    }
  });

export type ServerEnv = z.infer<typeof envSchema> & {
  apiBaseUrl: string;
  maxAmountCents: number;
};

let cached: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // On ne liste que les NOMS des variables fautives, jamais leurs valeurs.
    const names = [...new Set(parsed.error.issues.map((i) => i.path.join(".")))].join(", ");
    throw new Error(`Configuration invalide : ${names}`);
  }
  const env = parsed.data;
  cached = {
    ...env,
    apiBaseUrl:
      env.HELLOASSO_ENV === "production"
        ? "https://api.helloasso.com"
        : "https://api.helloasso-sandbox.com",
    maxAmountCents: env.DONATION_MAX_EUR * 100,
  };
  return cached;
}

/** Pour les tests uniquement. */
export function resetEnvCache() {
  cached = null;
}
