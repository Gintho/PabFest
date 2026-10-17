import { site } from "@/config/site";

/** errorUrl HelloAsso : erreur technique pendant le parcours de paiement. */
export default function Erreur() {
  return (
    <section className="card result" role="alert">
      <h1>Une erreur est survenue</h1>
      <p className="lead">
        Le paiement n&apos;a pas pu être finalisé suite à une erreur technique. Si un montant vous a été débité, vous
        recevrez un email de HelloAsso ; ne refaites pas de paiement sans l&apos;avoir vérifié.
      </p>
      <p>
        <a className="btn btn-primary" href="/">Revenir au formulaire</a>
      </p>
      <p className="small muted">
        Contact : <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
      </p>
    </section>
  );
}
