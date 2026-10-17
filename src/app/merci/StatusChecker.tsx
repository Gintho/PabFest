"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/config/site";
import { formatEuros } from "@/lib/schema";

type Status = "confirmed" | "pending" | "refused" | "unknown";

const MAX_ATTEMPTS = 8;

export function StatusChecker({ checkoutIntentId }: { checkoutIntentId: string | null }) {
  const [status, setStatus] = useState<Status>("pending");
  const [amount, setAmount] = useState<number | null>(null);
  const [done, setDone] = useState(!checkoutIntentId);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!checkoutIntentId) return;
    let cancelled = false;
    let attempt = 0;
    const poll = async () => {
      attempt++;
      try {
        const r = await fetch(`/api/status?id=${encodeURIComponent(checkoutIntentId)}`, { cache: "no-store" });
        const data = (await r.json()) as { status?: Status; amountCents?: number | null };
        if (cancelled) return;
        if (data.amountCents) setAmount(data.amountCents);
        if (data.status === "confirmed" || data.status === "refused") {
          setStatus(data.status);
          setDone(true);
          return;
        }
      } catch {
        /* on réessaie */
      }
      if (attempt < MAX_ATTEMPTS && !cancelled) setTimeout(poll, Math.min(1500 * attempt, 6000));
      else if (!cancelled) setDone(true);
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [checkoutIntentId]);

  useEffect(() => {
    if (done) heading.current?.focus();
  }, [done]);

  if (status === "confirmed") {
    return (
      <div role="status">
        <h1 ref={heading} tabIndex={-1}>Merci ! Paiement confirmé</h1>
        <p className="lead">
          Votre don{amount ? ` de ${formatEuros(amount)}` : ""} à {site.associationName} a bien été confirmé par HelloAsso.
        </p>
        <ReceiptReminder />
      </div>
    );
  }

  if (status === "refused") {
    return (
      <div role="alert">
        <h1 ref={heading} tabIndex={-1}>Paiement non abouti</h1>
        <p>Votre paiement n&apos;a pas été accepté. Aucun montant n&apos;a été prélevé.</p>
        <p><a className="btn btn-primary" href="/">Réessayer</a></p>
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite">
      <h1 ref={heading} tabIndex={-1}>Paiement en cours de vérification</h1>
      {!done ? (
        <p className="lead"><span className="spinner" aria-hidden="true" /> Nous vérifions votre paiement auprès de HelloAsso…</p>
      ) : (
        <p className="lead">
          Nous n&apos;avons pas encore pu confirmer votre paiement. S&apos;il a été accepté, vous recevrez un email
          de confirmation de HelloAsso. En cas de doute, contactez-nous à{" "}
          <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> ; ne refaites pas de paiement sans
          avoir vérifié vos emails.
        </p>
      )}
      <ReceiptReminder />
    </div>
  );
}

function ReceiptReminder() {
  return (
    <div className="notice notice-info">
      <p>
        <strong>Votre reçu fiscal</strong> est émis par HelloAsso au nom de {site.associationName} et envoyé à
        l&apos;adresse email saisie. Il est aussi disponible dans votre espace donateur HelloAsso. Pensez à vérifier
        vos spams.
      </p>
    </div>
  );
}
