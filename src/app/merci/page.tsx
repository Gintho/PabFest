import { redirect } from "next/navigation";
import { StatusChecker } from "./StatusChecker";

/**
 * Page de retour HelloAsso (returnUrl). HelloAsso y ajoute checkoutIntentId,
 * code et orderId : ces paramètres ne sont PAS dignes de confiance, le statut
 * affiché provient uniquement de GET /api/status (relecture serveur).
 */
export default async function Merci({
  searchParams,
}: {
  searchParams: Promise<{ checkoutIntentId?: string; code?: string }>;
}) {
  const { checkoutIntentId, code } = await searchParams;
  const id = checkoutIntentId && /^\d{1,15}$/.test(checkoutIntentId) ? checkoutIntentId : null;

  if (code === "refused") redirect(id ? `/echec?checkoutIntentId=${id}` : "/echec");

  return (
    <section className="card result">
      <StatusChecker checkoutIntentId={id} />
    </section>
  );
}
