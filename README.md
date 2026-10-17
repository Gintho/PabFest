# Partenaires & Mécénat — OnePage de dons HelloAsso

Page de dons unique (entreprises et particuliers) branchée sur **HelloAsso API v5 – Checkout**.
Next.js 16 (App Router, TypeScript), déployable sur Vercel, sans base de données.

```
Étape 1  Vos informations   →  Étape 2  Votre don + récapitulatif  →  Paiement sur HelloAsso
Étape 3  Votre reçu fiscal  (bloc d'information visible dès l'étape 1)
Retours : /merci (statut relu côté serveur) · /echec · /erreur
```

## Constats sur l'API HelloAsso

Ces points ont été vérifiés dans l'OpenAPI v5, via les SDK officiels générés `HelloAsso/helloasso-python` et `helloasso-node`, version de septembre 2026.

| Sujet | Constat | Conséquence dans le code |
|---|---|---|
| Création | `POST /v5/organizations/{slug}/checkout-intents` : `totalAmount`, `initialAmount` (centimes), `itemName` (≤ 250), `backUrl`, `errorUrl`, `returnUrl`, `containsDonation`, `payer`, `metadata` (JSON ≤ 20 000) → `{ id, redirectUrl }` | `src/lib/helloasso.ts` |
| Payeur | `firstName`, `lastName`, `email`, `dateOfBirth`, `address`, `city`, `zipCode`, `country` (ISO **alpha-3**), `companyName` (« used if the payer is a company ») | Raison sociale envoyée dans `companyName`. **Aucun champ SIREN** → SIREN transmis dans `metadata` |
| Relecture | `GET /v5/organizations/{slug}/checkout-intents/{id}` → `order.payments[].state`, `order.amount.total`, `metadata` | Source de vérité pour le webhook et `/api/status` |
| Notifications | `{ eventType: Order\|Payment\|Form\|Organization, data, metadata }` ; `Order.checkoutIntentId` | `src/lib/webhook.ts` |
| Signature | En-tête `x-ha-signature` = HMAC-SHA256 du corps, **documenté pour les comptes partenaires** | Vérifié si `HELLOASSO_WEBHOOK_SIGNATURE_KEY` est défini ; sinon on s'appuie sur un jeton secret dans l'URL et, **toujours**, sur la relecture via l'API |
| Reçu fiscal | Aucun endpoint d'émission par donateur. On trouve seulement `payments[].fiscalReceiptUrl` en lecture et la *configuration* des reçus de l'organisation | Le reçu est **émis et envoyé par HelloAsso**, sans rien d'inventé. Prérequis : activer les reçus fiscaux dans le back-office HelloAsso |

## Configuration

Copier `.env.example` vers `.env.local` (local) ou renseigner les variables dans Vercel. Toutes ces variables restent **côté serveur**.

| Variable | Obligatoire | Rôle |
|---|---|---|
| `HELLOASSO_CLIENT_ID` / `HELLOASSO_CLIENT_SECRET` | oui | Identifiants API (back-office HelloAsso → Intégrations et API) |
| `HELLOASSO_ORG_SLUG` | oui | Slug de l'association |
| `HELLOASSO_ENV` | oui | `sandbox` (par défaut) ou `production` |
| `SITE_URL` | oui | URL publique, sans `/` final ; HTTPS obligatoire en production |
| `HELLOASSO_WEBHOOK_TOKEN` | oui | ≥ 32 caractères (`openssl rand -hex 32`) |
| `HELLOASSO_WEBHOOK_SIGNATURE_KEY` | non | Clé de signature HelloAsso, si votre compte y a accès |
| `DONATION_MAX_EUR` | non | Montant maximum (par défaut 50 000) |
| `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | non | Active Cloudflare Turnstile (le honeypot est toujours actif) |

**Textes, logo et couleurs** :
- `src/config/site.ts` : nom de l'association, montants prédéfinis, pays, **mentions fiscales**. Tous les `[PLACEHOLDERS]` sont à valider avec l'association ; aucun taux n'est affirmé.
- `src/app/globals.css` : variables `--brand`, `--accent`, etc.
- `public/logo.svg` : logo.
- `src/app/confidentialite/page.tsx` : modèle de politique de confidentialité à compléter.

## Lancement local

```bash
npm ci
cp .env.example .env.local   # puis compléter
npm run dev                  # http://localhost:3000
npm test                     # tests unitaires (HelloAsso mocké)
npm run typecheck
```

Pour recevoir les notifications en local, exposez le port avec un tunnel (`cloudflared tunnel --url http://localhost:3000`) et déclarez l'URL `https://<tunnel>/api/webhook?token=<HELLOASSO_WEBHOOK_TOKEN>` dans le back-office **sandbox**. Mettez aussi `SITE_URL` à l'URL du tunnel.

## Déploiement Vercel

1. Importer le dépôt dans Vercel (framework détecté : Next.js).
2. Renseigner les variables d'environnement (Production et Preview), en commençant par `HELLOASSO_ENV=sandbox`.
3. Déclarer l'URL de notification chez HelloAsso : `https://<domaine>/api/webhook?token=<HELLOASSO_WEBHOOK_TOKEN>`.
4. Recommandé : dans Vercel → Firewall, ajouter une règle **Rate Limit** sur `/api/checkout` et `/api/webhook`. Le limiteur intégré fonctionne par instance serverless.
5. Dérouler la checklist [RECETTE.md](RECETTE.md).

## Passage sandbox → production

Aucune modification de code n'est nécessaire.

1. Recette sandbox validée (RECETTE.md), mentions fiscales et politique de confidentialité validées par l'association.
2. Dans Vercel (environnement Production) : `HELLOASSO_ENV=production`, avec les `CLIENT_ID`/`SECRET` **de production**, le slug de production, `SITE_URL` en HTTPS et un **nouveau** `HELLOASSO_WEBHOOK_TOKEN`.
3. Déclarer l'URL de notification dans le back-office HelloAsso **de production**.
4. Vérifier que les reçus fiscaux sont activés dans le back-office de production.
5. Redéployer, puis faire un vrai don de 1 € et vérifier : redirection, `/merci` « Paiement confirmé », log `donation_confirmed`, email et reçu.

## Sécurité

- Secrets uniquement côté serveur (`src/lib/env.ts`, validés par zod) ; le client ne reçoit que la `redirectUrl`.
- `returnUrl`, `backUrl` et `errorUrl` sont construites depuis `SITE_URL` ; la `redirectUrl` doit appartenir à `helloasso.com` ou `helloasso-sandbox.com`.
- Montant en centimes, borné côté serveur ; schéma zod identique côté client et côté serveur.
- Webhook : jeton d'URL comparé en temps constant, signature HMAC optionnelle, **relecture systématique** via `GET checkout-intents/{id}` (paiement `Authorized` et montant identique à celui demandé), réponse 200 immédiate puis traitement en `after()`, idempotence par `checkoutIntentId`.
- `/merci` n'affiche « Paiement confirmé » qu'après relecture serveur (`/api/status`) ; les paramètres de l'URL ne sont pas crus.
- Le contrôle d'origine sur `/api/checkout` joue le rôle d'anti-CSRF ; honeypot et Turnstile optionnel ; limitation de débit.
- En-têtes : CSP stricte avec nonce et `strict-dynamic` (`src/proxy.ts`), HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors 'none'` et `X-Frame-Options: DENY`.
- Logs JSON sans données personnelles : les clés sensibles sont masquées automatiquement (`src/lib/log.ts`). Aucune donnée de carte ne transite par le site.

### Limites connues de la v1 (sans base de données)

- **Idempotence et rate limiting en mémoire, par instance.** Un rejeu traité par une autre instance peut produire une seconde ligne `donation_confirmed` : dédoublonnez sur `checkoutIntentId` lors de l'exploitation des logs. Pour la v2, branchez un store partagé (Upstash/Vercel KV) dans `src/lib/idempotency.ts` et `src/lib/ratelimit.ts`.
- La relecture se fait après la réponse 200 : si l'API HelloAsso est indisponible à ce moment-là, le log de confirmation manque. Le donateur, lui, voit le bon statut sur `/merci`, et le back-office HelloAsso fait foi.

## Structure

```
src/proxy.ts                CSP + nonce
src/config/site.ts          textes, montants, mentions fiscales (éditables)
src/lib/schema.ts           validation zod partagée client/serveur
src/lib/helloasso.ts        OAuth2 (cache) + checkout-intents + interprétation du statut
src/lib/webhook.ts          authenticité, extraction, traitement idempotent
src/app/api/{checkout,webhook,status}/route.ts
src/app/page.tsx, DonationForm.tsx, FiscalInfo.tsx
src/app/{merci,echec,erreur,confidentialite}/
tests/                      schema, checkout, webhook, status
```
