import { site } from "@/config/site";

export const metadata = { title: "Politique de confidentialité" };

/** ⚠️ Modèle à compléter et valider par l'association (responsable de traitement). */
export default function Confidentialite() {
  return (
    <article className="card prose">
      <h1>Politique de confidentialité</h1>
      <p className="notice notice-info">[TEXTE À COMPLÉTER ET VALIDER PAR L&apos;ASSOCIATION]</p>
      <h2>Responsable de traitement</h2>
      <p>{site.associationName} — [ADRESSE] — <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a></p>
      <h2>Données collectées et finalité</h2>
      <p>
        Identité ou raison sociale, SIREN (facultatif), adresse, nom et email du contact, montant du don. Ces données
        servent exclusivement au traitement de votre don et à l&apos;émission du reçu fiscal.
      </p>
      <h2>Destinataire</h2>
      <p>
        Les données sont transmises à HelloAsso, qui opère le paiement et émet le reçu fiscal au nom de
        l&apos;association. Ce site ne conserve aucune donnée personnelle ni bancaire.
      </p>
      <h2>Base légale et durée de conservation</h2>
      <p>[BASE_LEGALE] — [DURÉE_DE_CONSERVATION]</p>
      <h2>Vos droits</h2>
      <p>
        Accès, rectification, effacement, opposition : écrivez à{" "}
        <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>. Vous pouvez aussi saisir la CNIL.
      </p>
      <p><a href="/">← Retour au formulaire de don</a></p>
    </article>
  );
}
