# Checklist de recette — SANDBOX

Prérequis : compte association sur https://www.helloasso-sandbox.com, `HELLOASSO_ENV=sandbox`, site déployé (preview Vercel ou tunnel), URL de notification déclarée dans le back-office sandbox, reçus fiscaux activés. Cartes de test : voir la documentation HelloAsso (« Tester vos paiements »).

Suivre les logs : Vercel → Logs, filtre `event`.

## 0. Configuration
- [ ] La page `/` s'affiche, sans erreur dans la console du navigateur (aucune violation CSP).
- [ ] `curl -I https://<site>/` : présence de `Content-Security-Policy` (avec nonce), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `frame-ancestors 'none'`.
- [ ] Aucun secret dans le bundle : `grep -r "<CLIENT_SECRET>" .next/static` ne renvoie rien.
- [ ] Les mentions fiscales et la politique de confidentialité ont été validées par l'association (plus aucun `[PLACEHOLDER]`).

## 1. Paiement réussi — Entreprise
- [ ] Choisir « Entreprise », remplir raison sociale, SIREN, contact, email et adresse, puis cocher le consentement.
- [ ] Étape 2 : choisir un montant ; le récapitulatif affiche le montant, le bénéficiaire, l'email du reçu et la mention « Paiement sécurisé HelloAsso ».
- [ ] « Payer » redirige vers HelloAsso sandbox ; nom, email, adresse et **raison sociale** sont préremplis.
- [ ] Payer avec une carte de test acceptée.
- [ ] Retour sur `/merci?checkoutIntentId=…&code=succeeded…` : « Paiement en cours de vérification » puis « **Paiement confirmé** ».
- [ ] Logs : `checkout_created`, puis `donation_confirmed` (montant, `checkoutIntentId`, aucune donnée personnelle).
- [ ] Email de confirmation et **reçu fiscal** reçus à l'adresse saisie ; le reçu porte la raison sociale. Vérifier si le SIREN et l'adresse y figurent et ajuster `fiscalContent.companyNote`.
- [ ] Le reçu est visible dans l'espace donateur HelloAsso sandbox ; noter le délai réel pour remplacer `[DÉLAI_RECU_A_CONFIRMER]`.
- [ ] Vérifier sur la page HelloAsso la présence de la contribution facultative et ajuster le texte du récapitulatif si besoin.

## 2. Paiement réussi — Particulier
- [ ] Même parcours en « Particulier », avec un montant libre (ex. 12,50 €).
- [ ] Le reçu est au nom de la personne.

## 3. Paiement refusé
- [ ] Payer avec une carte de test refusée.
- [ ] Noter l'URL de retour réelle (returnUrl avec `code=refused`, ou errorUrl) : on doit arriver sur `/echec` (ou `/erreur`).
- [ ] Aucun `donation_confirmed` dans les logs ; éventuellement `webhook_not_confirmed`.

## 4. Abandon
- [ ] Sur la page HelloAsso, cliquer sur le lien de retour : on revient sur `/?retour=annule` avec le message « aucun montant prélevé ».
- [ ] Fermer l'onglet HelloAsso sans payer : aucun `donation_confirmed`.
- [ ] Ouvrir `/merci?checkoutIntentId=<id_abandonné>` : la page doit afficher « Paiement en cours de vérification » et jamais « confirmé ».

## 5. Webhook
- [ ] **Rejeu** : copier une notification réelle et la renvoyer 3 fois. Une seule ligne `donation_confirmed`, puis des `webhook_duplicate_ignored` (même instance).
  ```bash
  curl -X POST "https://<site>/api/webhook?token=<TOKEN>" -H "Content-Type: application/json" -d @notif.json
  ```
- [ ] **Jeton faux ou absent** → 401 et `webhook_bad_token`.
- [ ] **Payload falsifié** : un `checkoutIntentId` d'un paiement abandonné avec `"state":"Authorized"` inventé ne produit aucun `donation_confirmed` (`webhook_not_confirmed`, statut `pending`).
- [ ] **Montant falsifié** dans le payload : sans effet, car seul le montant relu via l'API compte.
- [ ] Si `HELLOASSO_WEBHOOK_SIGNATURE_KEY` est défini : une notification sans `x-ha-signature` ou avec un corps modifié → 401. **Confirmer le format exact de la signature (hex ou base64) sur une notification réelle.**
- [ ] Événement `Form` → 200, sans effet.
- [ ] Vérifier sur une notification réelle que `checkoutIntentId` se trouve bien dans `data` (Order) ou dans `data.order` (Payment) ; sinon adapter `extractCheckoutIntentId`.

## 6. Robustesse et sécurité
- [ ] Montant 0,50 € ou > max : message d'erreur côté client ; requête forcée via curl → 422.
- [ ] `curl` sur `/api/checkout` sans en-tête `Origin` correct → 403.
- [ ] Plus de 5 tentatives par minute depuis la même IP → 429.
- [ ] Honeypot rempli (via curl) → 400, sans appel à HelloAsso.
- [ ] Turnstile (si activé) : le widget s'affiche à l'étape 2 et le paiement est bloqué sans validation.
- [ ] Accessibilité : parcours complet au clavier, focus visible, erreurs annoncées (lecteur d'écran) et liens vers les champs, zoom à 200 %.
- [ ] `npm audit` : 0 vulnérabilité.

## 7. Go / No-go production
- [ ] Toutes les cases ci-dessus sont cochées.
- [ ] Validation écrite de l'association, puis passage en production selon le README (§ Passage sandbox → production).
