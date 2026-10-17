import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { site } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  title: `${site.pageTitle} – ${site.associationName}`,
  description: site.intro,
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Lecture des en-têtes => rendu dynamique, nécessaire au nonce CSP.
  await headers();
  return (
    <html lang="fr">
      <body>
        <a className="skip-link" href="#contenu">
          Aller au contenu
        </a>
        <header className="site-header">
          <div className="container header-inner">
            <a href="/" className="brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={site.logo.src} alt={site.logo.alt} width={site.logo.width} height={site.logo.height} />
            </a>
            <p className="secure-badge">
              <LockIcon /> Paiement sécurisé HelloAsso
            </p>
          </div>
        </header>
        <main id="contenu" className="container">
          {children}
        </main>
        <footer className="site-footer">
          <div className="container">
            <p>
              {site.associationName} · <a href={site.privacyPolicyUrl}>Politique de confidentialité</a> ·{" "}
              <a href={`mailto:${site.contactEmail}`}>Nous contacter</a>
            </p>
            <p className="muted">
              Les paiements sont traités par HelloAsso. Aucune donnée bancaire ne transite par ce site.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
