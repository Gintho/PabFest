# Templates de mails — campagne Partenaires & Mécénat Pab Fest

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
| 1 | J0 | Présentation |
| 2 | J+7 | Relance courte |
| 3 | J+14 | Relance « impact local » |
| 4 | J+21 | Dernière relance |
| 5 | après un don | Merci donateur |
| 6 | après un partenariat | Merci partenaire + demande de logo |

---

## Mail 1 — J0 · Présentation

**Objet :** {{Prénom}}, le Pab Fest a besoin de {{Entreprise}} pour faire vivre l'île de Batz
**Objet alternatif (test A/B) :** Un festival sur l'île de Batz, un reçu fiscal pour {{Entreprise}}

Bonjour {{Prénom}},

Chaque mois de juin, le **Pab Fest** réunit sur l'île de Batz les brasseries artisanales bretonnes et des groupes de musiques du monde. L'entrée est libre, et le festival fait travailler toute l'île : commerces, hébergeurs, traversée depuis Roscoff.

Pour l'édition [2027], nous cherchons des entreprises du territoire prêtes à nous soutenir. Trois raisons de le faire :

**1. Votre soutien est déductible.** Le Pab Fest est une association reconnue d'intérêt général, confirmé par un **rescrit fiscal**. Chaque don ouvre droit à un **reçu fiscal, envoyé automatiquement** par HelloAsso. Pour une entreprise, la réduction d'impôt est de [60 %] du montant : un soutien de 750 € vous coûte réellement [300 €].

**2. Vous êtes visible.** À partir de 750 €, devenez partenaire : logo sur notre site et nos t-shirts, posts Instagram, et jusqu'à un stand à vos couleurs pendant le festival.

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

En deux mots : un soutien à partir de 100 €, un **reçu fiscal automatique** (nous sommes reconnus d'intérêt général), et dès 750 € une visibilité sur le festival.

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
- **400 €** : [la traversée et l'accueil d'une brasserie bretonne]
- **1 500 €** : [une scène équipée pour une soirée] + votre logo sur les t-shirts des bénévoles

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

Nous bouclons le budget du Pab Fest [2027] le [date limite]. Si {{Entreprise}} souhaite figurer parmi nos partenaires, il est encore temps :

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

## Mail 6 — Merci partenaire + demande de logo

**Objet :** Bienvenue parmi les partenaires du Pab Fest, {{Entreprise}} !

Bonjour {{Prénom}},

Merci ! {{Entreprise}} rejoint les partenaires du Pab Fest [2027] avec la formule **{{Formule}}** ({{Montant}} €).

Votre **reçu fiscal** vous a été envoyé par HelloAsso à {{Email}}.

Pour préparer votre visibilité, pouvez-vous nous répondre avec :
1. votre logo en haute définition (SVG, PDF ou PNG fond transparent) ;
2. le lien de votre site ou de votre compte Instagram ;
3. [Formule Brasseur] vos disponibilités pour caler le stand.

Calendrier : logo sur le site sous 7 jours, t-shirts imprimés le [date], post Instagram en [mois].

Merci pour votre confiance,
[Prénom Nom]
[téléphone]
