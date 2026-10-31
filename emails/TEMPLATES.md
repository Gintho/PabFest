# Templates de mails — campagne Partenaires & Mécénat Pab Fest

Grille 2027 : don classique de 1 à 250 € ; paliers avec visibilité dès 300 € (Pinte 300, Tournée 500, Fût 1 000, Tireuse 2 000, Brasseur 3 500).

Envoi depuis Gmail (publipostage depuis le fichier Google Sheets « Suivi mécénat »).
Variables entre `{{ }}` = colonnes du fichier de suivi. `[…]` = à compléter par le bureau.

Lien unique de la page (pas de pré-remplissage) :
`https://[domaine]/soutenir?src={{Source}}` (`src` sert uniquement à mesurer quel mail a déclenché le don).

Règles d'envoi :
- Entreprises uniquement en prospection (B2B). Particuliers : uniquement ceux qui ont donné leur accord.
- Chaque mail contient la ligne de désinscription. Une demande de désinscription = statut « Ne plus contacter ».
- La séquence s'arrête dès que le contact répond, donne ou se désinscrit.

| Mail | Quand | Objet |
|---|---|---|
| EB1 | J-14 (donateurs 2025) | Early bird |
| EB2 | J-7 (donateurs 2025) | Relance early bird + appel du référent |
| 1 | J0 | Présentation |
| 2 | J+7 | Relance courte |
| 3 | J+14 | Relance « impact local » |
| 4 | J+21 | Dernière relance |
| 5 | après un don | Merci donateur |
| 6 | après un palier dès 300 € | Merci + demande de logo |

---

## Parcours fidélité — entreprises donatrices 2025

Cible : entreprises ayant donné en 2025 (export des commandes HelloAsso 2025), colonnes `Donateur 2025 = Oui` et `Montant 2025` du fichier de suivi.
Elles reçoivent EB1 et EB2, puis **ne reçoivent pas** la séquence générale (mails 1 à 4).
`{{PalierSuggéré}}` = le palier immédiatement au-dessus de leur don 2025 (ex. 250 € → La Pinte 300 € ; 500 € → Le Fût 1 000 €).
Avantage fidèle [à valider, doit rester symbolique] : mention « Soutien fidèle depuis 2025 » sur le site, choix prioritaire de l'emplacement de stand.

### Mail EB1 — J-14 · Early bird

**Objet :** {{Prénom}}, vous êtes les premiers prévenus pour le Pab Fest 2027

Bonjour {{Prénom}},

En 2025, {{Entreprise}} a fait partie de celles et ceux qui ont rendu le Pab Fest possible. Merci encore, sincèrement.

Avant d'ouvrir notre campagne de soutien au public le [date], nous tenions à vous prévenir en premier.

À chaque édition, nous apprenons. En 2025, [ce que nous avons appris : ex. plus de brasseries, une meilleure organisation de la traversée]. Pour 2027, [ce qui change grâce à ces enseignements].

Nous serions tellement heureux de vous compter parmi nos **membres fidèles**.

L'an dernier, vous nous aviez soutenus à hauteur de {{Montant2025}} €. Cette année, le palier **{{PalierSuggéré}}** vous offre en plus [contrepartie du palier]. Et en tant que soutien fidèle, votre nom figurera avec la mention « Soutien fidèle depuis 2025 » [à valider].

En répondant avant le [date limite early bird], vous choisissez votre palier avant l'ouverture au public. Comme en 2025, votre **reçu fiscal** vous est envoyé automatiquement par HelloAsso.

👉 **Renouveler mon soutien :** https://[domaine]/soutenir?src=earlybird

Je reste joignable au [téléphone] pour en parler de vive voix.

Avec toute notre reconnaissance,

[Prénom Nom]
Président(e) du Pab Fest — association Mignoned ar Pab

### Mail EB2 — J-7 · Relance early bird

**Objet :** Re: vous êtes les premiers prévenus pour le Pab Fest 2027

Bonjour {{Prénom}},

Petit rappel : l'accès en avant-première aux paliers 2027 se termine le [date limite early bird]. Après, la campagne s'ouvre à tous.

Ce serait une joie de vous retrouver à nos côtés, {{Entreprise}} :
👉 https://[domaine]/soutenir?src=earlybird2

[Prénom du référent] vous appellera dans les prochains jours si vous préférez en parler.

Belle journée,
[Prénom]

### Merci « membre fidèle » (remplace le mail 6 pour ce segment)

**Objet :** Merci {{Prénom}} ! {{Entreprise}}, membre fidèle du Pab Fest

Reprend le mail 6, en ajoutant en ouverture : « Deux éditions à nos côtés : merci pour cette fidélité, elle compte énormément pour l'île et pour toute l'équipe. »

---

## Mail 1 — J0 · Présentation

**Objet :** {{Prénom}}, le Pab Fest a besoin de {{Entreprise}} pour faire vivre l'île de Batz
**Objet alternatif (test A/B) :** Un festival sur l'île de Batz, un reçu fiscal pour {{Entreprise}}

Bonjour {{Prénom}},

Chaque mois de juin, le **Pab Fest** réunit sur l'île de Batz les brasseries artisanales bretonnes et des groupes de musiques du monde. L'entrée est libre, et le festival fait travailler toute l'île : commerces, hébergeurs, traversée depuis Roscoff.

Pour l'édition [2027], nous cherchons des entreprises du territoire prêtes à nous soutenir. Trois raisons de le faire :

**1. Votre soutien est déductible.** Le Pab Fest est une association reconnue d'intérêt général, confirmé par un **rescrit fiscal**. Chaque don ouvre droit à un **reçu fiscal, envoyé automatiquement** par HelloAsso. Pour une entreprise, la réduction d'impôt est de [60 %] du montant : un soutien de 500 € vous coûte réellement [200 €].

**2. Vous êtes visible.** Dès 300 €, votre logo apparaît sur notre site ; selon le palier, il s'affiche aussi sur nos t-shirts, notre affiche, nos posts Instagram, et jusqu'à un stand à vos couleurs pendant le festival.

**3. Vous faites vivre l'île.** Votre soutien reste ici : il rémunère les artistes, accueille les brasseurs locaux et garde le festival ouvert à tous.

👉 **Soutenir le Pab Fest en 2 minutes :** https://[domaine]/soutenir?src=mail1

Le paiement est sécurisé par HelloAsso, et votre reçu fiscal arrive directement par email.

Je suis disponible pour en parler de vive voix : [téléphone].

À très vite sur l'île,

[Prénom Nom]
[Fonction], Pab Fest — association Mignoned ar Pab
[téléphone] · [email]

<small>Vous recevez ce message car {{Entreprise}} est une entreprise du territoire. Pour ne plus recevoir nos messages, répondez simplement « STOP ».</small>

---

## Mail 2 — J+7 · Relance courte

**Objet :** Re: le Pab Fest a besoin de {{Entreprise}}

Bonjour {{Prénom}},

Je me permets de revenir vers vous au sujet du Pab Fest [2027].

En deux mots : un don dès 50 €, un **reçu fiscal automatique** (nous sommes reconnus d'intérêt général), et dès 300 € votre logo sur le festival.

👉 https://[domaine]/soutenir?src=mail2

Une question ? Répondez simplement à ce mail.

Bonne journée,
[Prénom]

<small>Pour ne plus recevoir nos messages, répondez « STOP ».</small>

---

## Mail 3 — J+14 · Relance « impact local »

**Objet :** Ce que votre soutien change sur l'île de Batz

Bonjour {{Prénom}},

Concrètement, voici à quoi sert un soutien au Pab Fest :

- **100 €** : [une partie du cachet d'un groupe]
- **500 €** : [l'accueil d'une brasserie bretonne] + votre nom sur le panneau des soutiens
- **1 000 €** : [une scène équipée pour une soirée] + votre logo sur les t-shirts des bénévoles

[Ajouter une photo de l'édition 2026]

Les entreprises qui nous soutiennent déjà : [logos / noms des premiers partenaires].

👉 Rejoignez-les : https://[domaine]/soutenir?src=mail3

Merci de votre attention,
[Prénom]

<small>Pour ne plus recevoir nos messages, répondez « STOP ».</small>

---

## Mail 4 — J+21 · Dernière relance

**Objet :** Dernier message de notre part, {{Prénom}}

Bonjour {{Prénom}},

C'est mon dernier message à ce sujet, promis.

Nous bouclons le budget du Pab Fest [2027] le [date limite]. Si {{Entreprise}} souhaite figurer parmi nos soutiens, il est encore temps :

👉 https://[domaine]/soutenir?src=mail4

Et si ce n'est pas le bon moment, aucun souci : venez simplement trinquer avec nous sur l'île en juin !

Merci et à bientôt,
[Prénom]

<small>Vous ne recevrez plus de relance pour cette campagne.</small>

---

## Mail 5 — Merci donateur (envoyé quand le don apparaît dans HelloAsso)

**Objet :** Merci {{Prénom}} ! Votre soutien au Pab Fest est bien arrivé

Bonjour {{Prénom}},

Toute l'équipe du Pab Fest vous remercie pour votre don de **{{Montant}} €**.

- Votre **reçu fiscal** vous a été envoyé par HelloAsso à {{Email}}. Il est aussi disponible dans votre espace HelloAsso. Pensez à regarder dans vos spams.
- Grâce à vous, [ce que le don finance].

Rendez-vous sur l'île du [dates 2027] : passez nous dire bonjour au bar, la première tournée de remerciements est pour nous [à valider : attention, contrepartie à garder symbolique].

Mille mercis,
[Prénom Nom], pour toute l'équipe du Pab Fest

---

## Mail 6 — Merci palier visibilité (dès 300 €) + demande de logo

**Objet :** Bienvenue parmi les soutiens du Pab Fest, {{Entreprise}} !

Bonjour {{Prénom}},

Merci ! {{Entreprise}} rejoint les soutiens du Pab Fest [2027] avec le palier **{{Palier}}** ({{Montant}} €).

Votre **reçu fiscal** vous a été envoyé par HelloAsso à {{Email}}.

Pour préparer votre visibilité, pouvez-vous nous répondre avec :
1. votre logo en haute définition (SVG, PDF ou PNG fond transparent) ;
2. le lien de votre site ou de votre compte Instagram ;
3. [Palier Brasseur] vos disponibilités pour caler le stand.

Calendrier : logo sur le site sous 7 jours, t-shirts imprimés le [date], post Instagram en [mois].

Merci pour votre confiance,
[Prénom Nom]
[téléphone]
