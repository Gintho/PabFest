import { z } from "zod";
import { site } from "@/config/site";

/**
 * Schéma de validation du don, partagé client/serveur : les mêmes règles
 * s'appliquent dans le formulaire et dans POST /api/checkout.
 * Les longueurs maximales respectent celles du modèle CheckoutPayer de l'API v5.
 */

export const MIN_AMOUNT_CENTS = 100; // 1 €

const NAME_RE = /^[\p{L}][\p{L}' .-]*$/u;
const countryCodes = site.countries.map((c) => c.code) as [string, ...string[]];

const personName = (label: string) =>
  z
    .string({ error: `${label} est obligatoire.` })
    .trim()
    .min(1, `${label} est obligatoire.`)
    .max(100, `${label} : 100 caractères maximum.`)
    .regex(NAME_RE, `${label} : lettres, espaces, apostrophes et tirets uniquement.`);

const email = z
  .string({ error: "L'email est obligatoire." })
  .trim()
  .toLowerCase()
  .max(254, "Email trop long.")
  .pipe(z.email("Adresse email invalide."));

const address = {
  address: z
    .string({ error: "L'adresse est obligatoire." })
    .trim()
    .min(3, "L'adresse est obligatoire.")
    .max(200, "Adresse : 200 caractères maximum."),
  zipCode: z
    .string({ error: "Le code postal est obligatoire." })
    .trim()
    .regex(/^[0-9A-Za-z -]{3,10}$/, "Code postal invalide."),
  city: z
    .string({ error: "La ville est obligatoire." })
    .trim()
    .min(1, "La ville est obligatoire.")
    .max(100, "Ville : 100 caractères maximum."),
  country: z.enum(countryCodes, { error: "Pays invalide." }),
};

const company = z.object({
  donorType: z.literal("company"),
  companyName: z
    .string({ error: "La raison sociale est obligatoire." })
    .trim()
    .min(1, "La raison sociale est obligatoire.")
    .max(255, "Raison sociale : 255 caractères maximum."),
  siren: z
    .string()
    .trim()
    .transform((s) => s.replace(/\s/g, ""))
    .refine((s) => s === "" || /^\d{9}$/.test(s), "Le SIREN comporte 9 chiffres.")
    .optional(),
  firstName: personName("Le prénom du contact"),
  lastName: personName("Le nom du contact"),
  email,
  ...address,
});

const individual = z.object({
  donorType: z.literal("individual"),
  firstName: personName("Le prénom"),
  lastName: personName("Le nom"),
  email,
  ...address,
});

export const donorSchema = z.discriminatedUnion("donorType", [company, individual], {
  error: "Choisissez « Entreprise » ou « Particulier ».",
});

export function buildDonationSchema(maxAmountCents: number) {
  return z.object({
    donor: donorSchema,
    amountCents: z
      .number({ error: "Le montant est obligatoire." })
      .int("Montant invalide.")
      .min(MIN_AMOUNT_CENTS, "Le don minimum est de 1 €.")
      .max(maxAmountCents, `Le don maximum est de ${formatEuros(maxAmountCents)}.`),
    consent: z.literal(true, { error: "Votre consentement est nécessaire pour continuer." }),
    /** Honeypot : doit rester vide (vérifié à part pour renvoyer une erreur générique). */
    website: z.string().max(200).optional(),
    turnstileToken: z.string().max(2048).optional(),
  });
}

export type DonationInput = z.infer<ReturnType<typeof buildDonationSchema>>;
export type DonorInput = z.infer<typeof donorSchema>;

/** Convertit une saisie en euros (« 50 », « 12,50 ») en centimes, ou null. */
export function eurosToCents(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

export function formatEuros(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** Aplatit les erreurs zod en { "donor.email": "message" } pour l'affichage. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
