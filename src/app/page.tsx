import { headers } from "next/headers";
import { site } from "@/config/site";
import { getEnv } from "@/lib/env";
import { errorInfo, log } from "@/lib/log";
import { DonationForm } from "./DonationForm";

export default async function Home({ searchParams }: { searchParams: Promise<{ retour?: string }> }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const { retour } = await searchParams;

  let config: { maxEuros: number; turnstileSiteKey?: string } | null = null;
  try {
    const env = getEnv();
    config = { maxEuros: env.DONATION_MAX_EUR, turnstileSiteKey: env.TURNSTILE_SITE_KEY };
  } catch (err) {
    log.error("config_invalid", errorInfo(err));
  }

  return (
    <>
      <section className="hero">
        <h1>{site.pageTitle}</h1>
        <p className="lead">{site.intro}</p>
      </section>

      {retour === "annule" && (
        <div className="notice notice-info" role="status">
          <p>Vous avez quitté la page de paiement : aucun montant n&apos;a été prélevé. Vous pouvez reprendre votre don ci-dessous.</p>
        </div>
      )}

      {config ? (
        <>
          {config.turnstileSiteKey && (
            <script
              src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
              nonce={nonce}
              async
              defer
            />
          )}
          <DonationForm maxEuros={config.maxEuros} turnstileSiteKey={config.turnstileSiteKey} />
        </>
      ) : (
        <div className="notice notice-error" role="alert">
          <p>Le service de don est momentanément indisponible. Merci de réessayer plus tard.</p>
        </div>
      )}
    </>
  );
}
