"use client";

import { useEffect, useId, useRef, useState } from "react";
import { site } from "@/config/site";
import {
  buildDonationSchema,
  donorSchema,
  eurosToCents,
  fieldErrors,
  formatEuros,
} from "@/lib/schema";
import { FiscalInfo } from "./FiscalInfo";

type DonorType = "company" | "individual";
type Errors = Record<string, string>;

const EMPTY_DONOR = {
  companyName: "",
  siren: "",
  firstName: "",
  lastName: "",
  email: "",
  address: "",
  zipCode: "",
  city: "",
  country: "FRA",
};

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
  }
}

export function DonationForm({ maxEuros, turnstileSiteKey }: { maxEuros: number; turnstileSiteKey?: string }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [donorType, setDonorType] = useState<DonorType | null>(null);
  const [donor, setDonor] = useState(EMPTY_DONOR);
  const [consent, setConsent] = useState(false);
  const [preset, setPreset] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();

  const step2Heading = useRef<HTMLHeadingElement>(null);
  const step1Heading = useRef<HTMLHeadingElement>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  const turnstileEl = useRef<HTMLDivElement>(null);
  const turnstileId = useRef<string | null>(null);

  const maxCents = maxEuros * 100;
  const amountCents = preset !== null ? preset * 100 : eurosToCents(custom);
  const presets = site.presetAmounts[donorType ?? "individual"];

  // Turnstile (optionnel) : rendu explicite une fois le script chargé.
  useEffect(() => {
    if (!turnstileSiteKey || step !== 2) return;
    let cancelled = false;
    const tryRender = () => {
      if (cancelled) return;
      if (!window.turnstile || !turnstileEl.current) return void setTimeout(tryRender, 200);
      if (turnstileId.current) return;
      turnstileId.current = window.turnstile.render(turnstileEl.current, {
        sitekey: turnstileSiteKey,
        language: "fr",
        callback: (t: string) => setTurnstileToken(t),
        "expired-callback": () => setTurnstileToken(undefined),
      });
    };
    tryRender();
    return () => {
      cancelled = true;
    };
  }, [turnstileSiteKey, step]);

  const update = (field: keyof typeof EMPTY_DONOR) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDonor((d) => ({ ...d, [field]: e.target.value }));

  function donorPayload() {
    const base = {
      donorType,
      firstName: donor.firstName,
      lastName: donor.lastName,
      email: donor.email,
      address: donor.address,
      zipCode: donor.zipCode,
      city: donor.city,
      country: donor.country,
    };
    return donorType === "company"
      ? { ...base, companyName: donor.companyName, siren: donor.siren }
      : base;
  }

  function showErrors(errs: Errors) {
    setErrors(errs);
    requestAnimationFrame(() => errorSummary.current?.focus());
  }

  function goToStep2(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const errs: Errors = {};
    if (!donorType) errs["donor.donorType"] = "Choisissez « Entreprise / personne morale » ou « Particulier ».";
    else {
      const res = donorSchema.safeParse(donorPayload());
      if (!res.success) {
        for (const [k, v] of Object.entries(fieldErrors(res.error))) errs[`donor.${k}`] = v;
      }
    }
    if (!consent) errs.consent = "Votre consentement est nécessaire pour continuer.";
    if (Object.keys(errs).length) return showErrors(errs);
    setErrors({});
    setStep(2);
    requestAnimationFrame(() => step2Heading.current?.focus());
  }

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const payload = {
      donor: donorPayload(),
      amountCents: amountCents ?? NaN,
      consent,
      website,
      turnstileToken,
    };
    const res = buildDonationSchema(maxCents).safeParse(payload);
    if (!res.success) {
      const errs = fieldErrors(res.error);
      if (errs.amountCents && amountCents === null) errs.amountCents = "Indiquez un montant valide (ex. 50 ou 12,50).";
      return showErrors(errs);
    }
    if (turnstileSiteKey && !turnstileToken) {
      return showErrors({ turnstile: "Merci de compléter la vérification anti-robot." });
    }

    setSubmitting(true);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await r.json().catch(() => ({}))) as {
        redirectUrl?: string;
        error?: string;
        fields?: Errors;
      };
      if (r.ok && data.redirectUrl) {
        window.location.assign(data.redirectUrl);
        return; // on garde le bouton désactivé pendant la redirection
      }
      if (data.fields && Object.keys(data.fields).length) {
        const backToStep1 = Object.keys(data.fields).some((k) => k.startsWith("donor") || k === "consent");
        if (backToStep1) setStep(1);
        showErrors(data.fields);
      } else {
        setServerError(data.error ?? "Une erreur est survenue. Merci de réessayer.");
      }
    } catch {
      setServerError("Connexion impossible. Vérifiez votre réseau et réessayez.");
    }
    setSubmitting(false);
    if (turnstileId.current) window.turnstile?.reset(turnstileId.current);
    setTurnstileToken(undefined);
  }

  const errorList = Object.entries(errors);

  return (
    <div className="layout">
      <div className="main-col">
        <Stepper step={step} />

        {errorList.length > 0 && (
          <div className="notice notice-error" role="alert" tabIndex={-1} ref={errorSummary}>
            <p>
              <strong>Merci de corriger {errorList.length > 1 ? `les ${errorList.length} points suivants` : "le point suivant"} :</strong>
            </p>
            <ul>
              {errorList.map(([k, msg]) => (
                <li key={k}>
                  <a href={`#${fieldId(k)}`}>{msg}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {serverError && (
          <div className="notice notice-error" role="alert">
            <p>{serverError}</p>
          </div>
        )}

        {step === 1 && (
          <form className="card" onSubmit={goToStep2} noValidate aria-labelledby="etape1-titre">
            <h2 id="etape1-titre" ref={step1Heading} tabIndex={-1}>
              <span className="step-num" aria-hidden="true">1</span> Vos informations
            </h2>

            <fieldset className="choice" aria-describedby={errors["donor.donorType"] ? "err-donor-donorType" : undefined}>
              <legend>Vous donnez en tant que</legend>
              <div className="choice-grid" id={fieldId("donor.donorType")}>
                {(
                  [
                    ["company", "Entreprise / personne morale"],
                    ["individual", "Particulier"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className={`choice-card${donorType === value ? " is-selected" : ""}`}>
                    <input
                      type="radio"
                      name="donorType"
                      value={value}
                      checked={donorType === value}
                      onChange={() => {
                        setDonorType(value);
                        setPreset(null);
                      }}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <FieldError name="donor.donorType" errors={errors} />
            </fieldset>

            {donorType && (
              <>
                {donorType === "company" && (
                  <div className="grid-2">
                    <Field name="donor.companyName" label="Raison sociale" errors={errors} autoComplete="organization"
                      value={donor.companyName} onChange={update("companyName")} required className="span-2" />
                    <Field name="donor.siren" label="SIREN" hint="Facultatif · 9 chiffres" errors={errors}
                      value={donor.siren} onChange={update("siren")} inputMode="numeric" />
                  </div>
                )}

                <p className="group-title">{donorType === "company" ? "Personne à contacter" : "Identité"}</p>
                <div className="grid-2">
                  <Field name="donor.firstName" label="Prénom" errors={errors} autoComplete="given-name"
                    value={donor.firstName} onChange={update("firstName")} required />
                  <Field name="donor.lastName" label="Nom" errors={errors} autoComplete="family-name"
                    value={donor.lastName} onChange={update("lastName")} required />
                  <Field name="donor.email" label="Email" type="email" errors={errors} autoComplete="email"
                    hint="Votre reçu fiscal sera envoyé à cette adresse." className="span-2"
                    value={donor.email} onChange={update("email")} required />
                </div>

                <p className="group-title">{donorType === "company" ? "Adresse du siège" : "Adresse"}</p>
                <div className="grid-2">
                  <Field name="donor.address" label="Adresse" errors={errors} autoComplete="street-address"
                    value={donor.address} onChange={update("address")} required className="span-2" />
                  <Field name="donor.zipCode" label="Code postal" errors={errors} autoComplete="postal-code"
                    value={donor.zipCode} onChange={update("zipCode")} required />
                  <Field name="donor.city" label="Ville" errors={errors} autoComplete="address-level2"
                    value={donor.city} onChange={update("city")} required />
                  <div className="field span-2">
                    <label htmlFor={fieldId("donor.country")}>Pays</label>
                    <select id={fieldId("donor.country")} value={donor.country} onChange={update("country")}
                      autoComplete="country">
                      {site.countries.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="field consent">
              <label className="checkbox">
                <input
                  id={fieldId("consent")}
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  aria-invalid={errors.consent ? true : undefined}
                  aria-describedby={errors.consent ? "err-consent" : undefined}
                  required
                />
                <span>
                  J&apos;accepte que mes données soient transmises à HelloAsso et utilisées par {site.associationName} pour
                  traiter mon don et émettre mon reçu fiscal, conformément à la{" "}
                  <a href={site.privacyPolicyUrl} target="_blank" rel="noopener">politique de confidentialité</a>.{" "}
                  <span className="required" aria-hidden="true">*</span>
                </span>
              </label>
              <FieldError name="consent" errors={errors} />
            </div>

            {/* Honeypot : invisible pour les humains, rempli par les robots. */}
            <div className="hp" aria-hidden="true">
              <label htmlFor="website">Site web</label>
              <input id="website" name="website" tabIndex={-1} autoComplete="off" value={website}
                onChange={(e) => setWebsite(e.target.value)} />
            </div>

            <div className="actions">
              <button type="submit" className="btn btn-primary">Continuer vers le don</button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form className="card" onSubmit={pay} noValidate aria-labelledby="etape2-titre">
            <h2 id="etape2-titre" ref={step2Heading} tabIndex={-1}>
              <span className="step-num" aria-hidden="true">2</span> Votre don
            </h2>

            <fieldset className="choice">
              <legend>Montant du don (paiement unique)</legend>
              <div className="amount-grid" id={fieldId("amountCents")}>
                {presets.map((v) => (
                  <label key={v} className={`choice-card amount${preset === v ? " is-selected" : ""}`}>
                    <input type="radio" name="amount" value={v} checked={preset === v}
                      onChange={() => { setPreset(v); setCustom(""); }} />
                    <span>{formatEuros(v * 100)}</span>
                  </label>
                ))}
              </div>
              <div className="field custom-amount">
                <label htmlFor="custom-amount">Autre montant (€)</label>
                <input id="custom-amount" inputMode="decimal" autoComplete="off" value={custom}
                  placeholder="Ex. 150"
                  onChange={(e) => { setCustom(e.target.value); setPreset(null); }}
                  aria-invalid={errors.amountCents ? true : undefined}
                  aria-describedby={`hint-amount${errors.amountCents ? " err-amountCents" : ""}`} />
                <p className="hint" id="hint-amount">Entre 1 € et {formatEuros(maxCents)}.</p>
                <FieldError name="amountCents" errors={errors} />
              </div>
            </fieldset>

            <section className="recap" aria-labelledby="recap-titre">
              <h3 id="recap-titre">Récapitulatif</h3>
              <dl>
                <div><dt>Montant</dt><dd>{amountCents ? formatEuros(amountCents) : "—"}</dd></div>
                <div><dt>Bénéficiaire</dt><dd>{site.associationName}</dd></div>
                <div>
                  <dt>Donateur</dt>
                  <dd>{donorType === "company" ? donor.companyName : `${donor.firstName} ${donor.lastName}`}</dd>
                </div>
                <div><dt>Reçu fiscal envoyé à</dt><dd className="break">{donor.email}</dd></div>
                <div><dt>Type</dt><dd>Don ponctuel</dd></div>
              </dl>
              <p className="secure-line">
                🔒 Paiement sécurisé réalisé sur HelloAsso. Vous allez être redirigé vers HelloAsso pour régler
                votre don ; aucune donnée bancaire n&apos;est saisie sur ce site.
              </p>
              <p className="small muted">
                Sur la page HelloAsso, une contribution facultative au fonctionnement de HelloAsso peut vous être
                proposée ; vous êtes libre de la modifier ou de la refuser.
              </p>
            </section>

            {turnstileSiteKey && (
              <div className="field" id={fieldId("turnstile")}>
                <div ref={turnstileEl} />
                <FieldError name="turnstile" errors={errors} />
              </div>
            )}

            <div className="actions">
              <button type="button" className="btn btn-secondary" onClick={() => { setStep(1); setErrors({}); requestAnimationFrame(() => step1Heading.current?.focus()); }}>
                Modifier mes informations
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting} aria-busy={submitting}>
                {submitting ? "Redirection vers HelloAsso…" : `Payer ${amountCents ? formatEuros(amountCents) : ""}`}
              </button>
            </div>
          </form>
        )}
      </div>

      <aside className="side-col">
        <FiscalInfo donorType={donorType ?? undefined} />
      </aside>
    </div>
  );
}

function Stepper({ step }: { step: 1 | 2 }) {
  const items = [
    { n: 1, label: "Vos informations", state: step === 1 ? "current" : "done" },
    { n: 2, label: "Votre don", state: step === 2 ? "current" : "todo" },
    { n: 3, label: "Votre reçu fiscal", state: "info" },
  ];
  return (
    <nav aria-label="Étapes du don">
      <ol className="stepper">
        {items.map((it) => (
          <li key={it.n} className={`step step-${it.state}`} aria-current={it.state === "current" ? "step" : undefined}>
            <span className="step-num" aria-hidden="true">{it.state === "done" ? "✓" : it.n}</span>
            <span>
              {it.label}
              {it.state === "done" && <span className="sr-only"> (terminée)</span>}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function fieldId(name: string) {
  return `f-${name.replace(/\./g, "-")}`;
}

function FieldError({ name, errors }: { name: string; errors: Errors }) {
  if (!errors[name]) return null;
  return (
    <p className="field-error" id={`err-${name.replace(/\./g, "-")}`}>
      {errors[name]}
    </p>
  );
}

function Field({
  name,
  label,
  errors,
  hint,
  className,
  required,
  ...input
}: {
  name: string;
  label: string;
  errors: Errors;
  hint?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = fieldId(name);
  const hintId = useId();
  const err = errors[name];
  const describedBy = [hint ? hintId : null, err ? `err-${name.replace(/\./g, "-")}` : null].filter(Boolean).join(" ");
  return (
    <div className={`field${className ? ` ${className}` : ""}`}>
      <label htmlFor={id}>
        {label}
        {required && <span className="required" aria-hidden="true"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        type={input.type ?? "text"}
        required={required}
        aria-required={required || undefined}
        aria-invalid={err ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...input}
      />
      {hint && <p className="hint" id={hintId}>{hint}</p>}
      <FieldError name={name} errors={errors} />
    </div>
  );
}
