import { site } from "@/config/site";

export default function Echec() {
  return (
    <section className="card result" role="alert">
      <h1>Paiement refusé</h1>
      <p className="lead">Votre paiement n&apos;a pas été accepté et aucun montant n&apos;a été prélevé.</p>
      <p>Causes fréquentes : plafond de carte atteint, authentification bancaire non validée, carte expirée.</p>
      <p>
        <a className="btn btn-primary" href="/">Réessayer mon don</a>
      </p>
      <p className="small muted">
        Besoin d&apos;aide ? <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
      </p>
    </section>
  );
}
