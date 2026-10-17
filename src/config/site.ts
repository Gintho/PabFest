/**
 * Configuration éditoriale NON secrète (importable côté client).
 * Les couleurs et la typographie sont dans src/app/globals.css (variables --brand-*).
 *
 * ⚠️ Tous les textes entre crochets [COMME_CECI] sont des placeholders à
 * valider avec l'association (bureau / expert-comptable) avant la mise en
 * production. Aucun taux ni plafond n'est affirmé par défaut.
 */

export const site = {
  /** Nom de l'association bénéficiaire, tel qu'il apparaît sur HelloAsso. */
  associationName: "[NOM_DE_L_ASSOCIATION]",
  /** Logo (fichier dans /public). Remplacez public/logo.svg ou changez le chemin. */
  logo: { src: "/logo.svg", alt: "[NOM_DE_L_ASSOCIATION]", width: 160, height: 48 },
  pageTitle: "Partenaires & Mécénat",
  intro:
    "Entreprises et particuliers, soutenez nos actions par un don. Le paiement est réalisé de façon sécurisée sur HelloAsso.",
  /** Lien vers la politique de confidentialité (page interne ou URL absolue). */
  privacyPolicyUrl: "/confidentialite",
  contactEmail: "[CONTACT@ASSOCIATION.ORG]",
  /** Libellé transmis à HelloAsso (itemName, 250 caractères max). */
  itemName: {
    company: "Don – mécénat d'entreprise",
    individual: "Don",
  },
  /** Montants prédéfinis en euros, selon le type de donateur. */
  presetAmounts: {
    company: [500, 1000, 2500, 5000],
    individual: [20, 50, 100, 250],
  },
  /** Pays proposés (code ISO 3166-1 alpha-3 attendu par HelloAsso). */
  countries: [
    { code: "FRA", label: "France" },
    { code: "BEL", label: "Belgique" },
    { code: "LUX", label: "Luxembourg" },
    { code: "CHE", label: "Suisse" },
    { code: "MCO", label: "Monaco" },
    { code: "DEU", label: "Allemagne" },
    { code: "ESP", label: "Espagne" },
    { code: "ITA", label: "Italie" },
    { code: "GBR", label: "Royaume-Uni" },
  ],
} as const;

/**
 * Bloc « Votre reçu fiscal ». Le reçu est émis par HelloAsso au nom de
 * l'association : ce site ne génère aucun reçu.
 */
export const fiscalContent = {
  title: "Votre reçu fiscal",
  howItWorks: [
    "Le reçu fiscal est émis par HelloAsso au nom de {associationName}.",
    "Il est envoyé par email à l'adresse que vous saisissez à l'étape 1 : vérifiez-la attentivement.",
    "Il est également disponible dans votre espace donateur HelloAsso (connexion avec la même adresse email).",
    "Pensez à vérifier vos courriers indésirables (spams).",
    "Délai indicatif de réception : [DÉLAI_RECU_A_CONFIRMER].",
  ],
  companyNote:
    "Pour une entreprise, le reçu est établi au nom de la raison sociale saisie. [VÉRIFIER AVEC HELLOASSO : mentions de l'entreprise (raison sociale, SIREN, adresse) présentes sur le reçu].",
  eligibility:
    "Un reçu fiscal ne peut être délivré que pour un don sans contrepartie significative. Si votre soutien donne lieu à une contrepartie (visibilité, prestations, avantages), contactez-nous avant de payer : il peut alors s'agir de parrainage, qui n'ouvre pas droit à reçu fiscal.",
  /** Mentions d'avantage fiscal — TEXTE À VALIDER, aucun taux par défaut. */
  taxBenefit: {
    company:
      "Entreprises : votre don peut ouvrir droit à une réduction d'impôt de [TAUX_REDUCTION_ENTREPRISE] du montant versé, dans la limite de [PLAFOND_ENTREPRISE]. [RÉFÉRENCE_LEGALE_A_CONFIRMER]",
    individual:
      "Particuliers : votre don peut ouvrir droit à une réduction d'impôt sur le revenu de [TAUX_REDUCTION_PARTICULIER] du montant versé, dans la limite de [PLAFOND_PARTICULIER] de votre revenu imposable. [RÉFÉRENCE_LEGALE_A_CONFIRMER]",
  },
  disclaimer:
    "L'éligibilité de l'association à l'émission de reçus fiscaux relève de sa responsabilité. [MENTION_A_VALIDER_PAR_L_ASSOCIATION]",
} as const;

export function interpolate(text: string): string {
  return text.replaceAll("{associationName}", site.associationName);
}
