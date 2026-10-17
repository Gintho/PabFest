import { fiscalContent, interpolate } from "@/config/site";

/** Étape 3 — affichée en permanence, dès l'étape 1. */
export function FiscalInfo({ donorType }: { donorType?: "company" | "individual" }) {
  return (
    <section className="card fiscal" aria-labelledby="recu-titre">
      <h2 id="recu-titre">
        <span className="step-num" aria-hidden="true">3</span> {fiscalContent.title}
      </h2>
      <ul className="checklist">
        {fiscalContent.howItWorks.map((line) => (
          <li key={line}>{interpolate(line)}</li>
        ))}
      </ul>
      {donorType !== "individual" && <p className="small">{fiscalContent.companyNote}</p>}
      <div className="notice notice-info">
        <p>
          <strong>Éligibilité :</strong> {fiscalContent.eligibility}
        </p>
      </div>
      <details className="details">
        <summary>Avantage fiscal</summary>
        {donorType !== "individual" && <p className="small">{fiscalContent.taxBenefit.company}</p>}
        {donorType !== "company" && <p className="small">{fiscalContent.taxBenefit.individual}</p>}
        <p className="small muted">{fiscalContent.disclaimer}</p>
      </details>
    </section>
  );
}
