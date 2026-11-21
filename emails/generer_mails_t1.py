"""Génère la version T1 des 6 mails (Markdown pour le dépôt + HTML pour Google Docs)."""
import html, re, sys

TITLE = "Pab Fest 2027 · Les 6 mails de la campagne mécénat (version T1 à valider)"

STOP = "*Pour ne plus recevoir nos messages, répondez simplement « STOP ».*"
SIGN = ["{{Signataire}}", "Pab Fest · association Mignoned ar Pab", "{{Téléphone}}"]

TITLE = "Pab Fest 2027 · Les mails de lancement de la campagne mécénat"

RECAP = [
    ("1", "Contributeurs 2025", "Entreprises qui ont soutenu le Pab Fest en 2025 (en argent, en nature ou par une promesse)", "15", "Semaine du 23 novembre"),
    ("2", "Contacts d'Eric Grall", "Entreprises recommandées par Eric Grall, jamais donatrices", "13", "Fin novembre"),
    ("3", "Toute la base", "Les autres entreprises de la base (hors refus 2025)", "185", "1er au 3 décembre"),
    ("4", "Relance clôture 2026", "Tous ceux qui n'ont pas encore donné", "jusqu'à 213", "14 ou 15 décembre"),
    ("5", "Relance de janvier", "Tous ceux qui n'ont pas encore donné", "jusqu'à 213", "6 ou 7 janvier"),
    ("6", "Relance de février", "Tous ceux qui n'ont pas encore donné", "jusqu'à 213", "2 ou 3 février"),
]
RULES = [
    "**On arrête d'écrire** à une entreprise dès qu'elle a donné, répondu ou écrit « STOP ». Avant chaque envoi, on filtre le fichier sur la colonne « Statut ».",
    "**Un seul lien par mail**, toujours le même formulaire. Seul le code de fin change (`?src=m1`, `m2`…) pour savoir quel mail a fonctionné.",
    "**Un signataire joignable**, avec son vrai numéro. Le mail 1 est signé par la présidence.",
    "**Ligne STOP obligatoire** dans les mails de prospection (mails 2 à 6).",
    "**Gmail gratuit = 100 envois par jour** : le mail 3 part en trois lots, et les relances aussi si la liste dépasse 100.",
    "**Pas de relance entre le 18 décembre et le 5 janvier.**",
]

MAILS = [
    dict(
        n="1", name="Contributeurs 2025",
        meta=[("Pour qui", "Les 15 entreprises contributrices 2025 (liste en annexe B), dont 8 du réseau d'Eric Grall"),
              ("Quand", "Semaine du 23 novembre, avant l'ouverture au public. Appel du référent 48 h après."),
              ("Signé par", "Le ou la président(e)"),
              ("Lien", "{{Lien}}?src=m1"),
              ("Pièce jointe", "Bilan de visibilité 2025, une page en PDF")],
        subject="{{Prénom}}, voici ce que {{Entreprise}} a rendu possible au Pab Fest 2025",
        subject_b="Partenaire 2025 : vous êtes les premiers prévenus pour 2027",
        body=[
            "Bonjour {{Prénom}},",
            "En 2025, {{Entreprise}} a soutenu le Pab Fest à hauteur de {{Montant2025}} €. Merci encore, sincèrement. Avant de vous parler de 2027, nous voulions vous montrer ce que ce soutien a produit.",
            "**Votre visibilité en 2025** :",
            "- votre nom et votre logo sur [supports : affiche, panneau des partenaires, site] ;",
            "- [nombre] publications Instagram qui vous citent, vues [nombre] fois ;",
            "- [nombre] festivaliers accueillis sur l'île de Batz, en entrée libre.",
            "Pour 2027, nous ouvrons le renouvellement à nos partenaires **avant tout le monde**, et nous vous proposons le palier **{{PalierSuggéré}}** ({{MontantPalier}} €). Il ajoute à votre visibilité : {{ContrepartiesEnPlus}}. Après la réduction d'impôt de 60 %, il vous coûte réellement **{{CoûtRéel}} €**. Renouveler au même niveau reste bien sûr possible.",
            "Deux bonnes raisons de décider avant le 31 décembre :",
            "- votre don compte sur votre **exercice 2026** ;",
            "- vous choisissez **en premier** votre visibilité, avec la mention « Partenaire fidèle depuis 2025 ».",
            "👉 **Renouveler mon soutien en 2 minutes :** {{Lien}}?src=m1",
            "Comme en 2025, votre reçu fiscal arrive automatiquement par email.",
            "Je vous appelle {{JourAppel}} pour en parler de vive voix, ou répondez simplement à ce mail.",
            "Avec toute notre reconnaissance,",
            "{{Signataire}}\nPrésident(e) du Pab Fest · association Mignoned ar Pab\n{{Téléphone}}",
        ],
        variants=[
            ("Grands partenaires (700 € et plus) : Lagadec, Paugam, Ty Coz, Empereur",
             "Remplacer le paragraphe « Pour 2027… » par : « Pour 2027, nous aimerions construire avec vous une présence sur mesure : le palier **Le Fût** (1 000 €, coût réel 400 €), ou **Le Brasseur** dès 2 000 € avec une scène ou un concert à votre nom. Pouvons-nous prendre 20 minutes ensemble, chez vous ou par téléphone, la semaine du [date] ? »"),
            ("Engagés en 2025 mais paiement non finalisé : Eurovia, Beach Break, Café Ty Pierre, JP Berton / EDF",
             "Remplacer les deux premiers paragraphes par : « En 2025, {{Entreprise}} avait accepté de soutenir le Pab Fest, mais le paiement ne s'est pas finalisé de notre côté. Nous aurions dû vous relancer : c'est notre faute. Pour 2027, tout se fait en ligne, en deux minutes. » Ne pas parler de bilan de visibilité."),
            ("Partenaire en nature : A L'Aise Breizh (150 t-shirts)",
             "Remplacer le paragraphe sur le montant par : « En 2025, vos 150 t-shirts ont habillé tous nos bénévoles. Pour 2027, seriez-vous partant pour renouveler ce partenariat, éventuellement complété d'un don ? Nous pouvons établir un reçu pour la valeur du don en nature. » [à valider par le trésorier]"),
        ],
        todo=[
            "Préparer le **bilan de visibilité 2025** et remplacer les chiffres entre crochets.",
            "Envoyer **avant ce mail** leur reçu 2025 à **Le Coz Couv** et **Maison Ty Nevez**, et trouver l'email de Ty Nevez.",
            "Remplir les colonnes {{PalierSuggéré}}, {{MontantPalier}}, {{CoûtRéel}} et {{ContrepartiesEnPlus}} (tableau en annexe B).",
        ],
    ),
    dict(
        n="2", name="Contacts d'Eric Grall",
        meta=[("Pour qui", "Les 13 entreprises du réseau d'Eric Grall qui n'ont jamais donné : Péran, Batibois, Raub, Colas, Suez, La Chikolodenn, Réseau Krill, Cozigou, Korn Peinture, Thierry Le Lez, Julien Le Lez, Seité Frères, J. Pacot Isolation"),
              ("Quand", "Fin novembre, dès qu'Eric a donné son accord et les contacts directs. Appel 48 h après."),
              ("Signé par", "Le ou la responsable partenariats"),
              ("Lien", "{{Lien}}?src=m2"),
              ("Pièce jointe", "Aucune (la plaquette peut suivre après l'appel)")],
        subject="{{Prénom}}, Eric Grall m'a conseillé de vous écrire",
        subject_b="De la part d'Eric Grall : le Pab Fest et {{Entreprise}}",
        body=[
            "Bonjour {{Prénom}},",
            "Eric Grall m'a parlé de vous et de {{Entreprise}} : il m'a dit que vous étiez attaché à ce qui fait vivre notre territoire. Je me permets donc de vous écrire directement.",
            "Je m'occupe des partenaires du **Pab Fest**, le festival de bières artisanales et de musiques du monde de l'île de Batz. Chaque mois de juin, il fait travailler les commerces de l'île, les hébergeurs et la traversée depuis Roscoff, et il reste en entrée libre.",
            "Pour 2027, nous cherchons quelques entreprises du Léon et du pays de Morlaix prêtes à nous accompagner :",
            "- **Votre soutien est déductible** : nous sommes reconnus d'intérêt général par rescrit fiscal, et votre reçu fiscal arrive automatiquement. Un soutien de 500 € vous coûte réellement 200 €.",
            "- **Vous êtes visible** : dès 300 €, le nom et le logo de {{Entreprise}} figurent sur nos supports. Dès 2 000 €, nous construisons avec vous une campagne sur mesure.",
            "- **Un don versé avant le 31 décembre compte sur votre exercice 2026.**",
            "Je vous appelle {{JourAppel}} pour en parler cinq minutes. Si vous préférez, tout est ici :",
            "👉 {{Lien}}?src=m2",
            "Merci d'avance, et à très vite,",
            "\n".join(SIGN),
        ],
        variants=[
            ("J. Pacot Isolation (refus en 2025)",
             "Ajouter après le premier paragraphe : « Je sais que le moment n'était pas le bon l'an dernier ; Eric pense que 2027 pourrait vous intéresser davantage, d'où ce message. »"),
        ],
        todo=[
            "Envoyer d'abord le mail à Eric Grall (déjà rédigé) : contacts directs et **accord pour citer son nom**.",
            "Sans accord d'Eric, utiliser le mail 3 à la place.",
            "Suez : pas d'email direct pour David Le Scanf, passer par Eric ou par LinkedIn.",
        ],
    ),
    dict(
        n="3", name="Toute la base",
        meta=[("Pour qui", "Environ 185 entreprises de la base, hors mails 1 et 2 et hors refus 2025"),
              ("Quand", "Du 1er au 3 décembre, en 3 lots de 60 à 70 (limite Gmail). Commencer par les priorités 1 et 2."),
              ("Signé par", "Le ou la responsable partenariats"),
              ("Lien", "{{Lien}}?src=m3"),
              ("Pièce jointe", "Aucune (un mail avec pièce jointe finit plus souvent en spam)")],
        subject="{{Prénom}}, le Pab Fest a besoin de {{Entreprise}} pour faire vivre l'île de Batz",
        subject_b="Un festival sur l'île de Batz, un reçu fiscal pour {{Entreprise}}",
        body=[
            "Bonjour {{Prénom}},",
            "Chaque mois de juin, le **Pab Fest** réunit sur l'île de Batz les brasseries artisanales bretonnes et des groupes de musiques du monde. L'entrée est libre, et tout le week-end fait travailler l'île : commerces, hébergeurs, traversée depuis Roscoff.",
            "Pour l'édition 2027, nous cherchons des entreprises du territoire prêtes à nous soutenir. Trois raisons de le faire :",
            "**1. Votre soutien est déductible.** Le Pab Fest est une association reconnue d'intérêt général par rescrit fiscal. Chaque don ouvre droit à un **reçu fiscal envoyé automatiquement**. Pour une entreprise, la réduction d'impôt est de 60 % : 500 € vous coûtent réellement 200 €. Et un don versé avant le 31 décembre compte sur votre exercice 2026.",
            "**2. Vous êtes visible.** Dès 300 €, votre nom et votre logo figurent sur nos supports. Selon le palier : panneau des soutiens sur le festival, Instagram, invitation à la soirée d'ouverture, logo sur les t-shirts des bénévoles, jusqu'à une campagne sur mesure.",
            "**3. Vous faites vivre l'île.** Votre soutien reste ici : il rémunère les artistes, accueille les brasseurs bretons et garde le festival ouvert à tous.",
            "👉 **Soutenir le Pab Fest en 2 minutes :** {{Lien}}?src=m3",
            "Le paiement est sécurisé par HelloAsso. Je reste joignable au {{Téléphone}} pour en parler de vive voix.",
            "À très vite sur l'île,",
            "{{Signataire}}\nPab Fest · association Mignoned ar Pab",
        ],
        variants=[],
        todo=[
            "Quand le prénom est inconnu (adresse générique), écrire « Bonjour, » et remplacer {{Prénom}} dans l'objet par le nom de l'entreprise.",
            "Décider si les 12 entreprises qui ont refusé en 2025 reçoivent ce mail (proposition : non).",
        ],
    ),
    dict(
        n="4", name="Relance clôture 2026",
        meta=[("Pour qui", "Tous ceux qui ont reçu les mails 1, 2 ou 3 et n'ont ni donné, ni répondu, ni écrit STOP"),
              ("Quand", "14 ou 15 décembre : dernier mail avant les fêtes"),
              ("Signé par", "Même signataire que le premier mail reçu"),
              ("Lien", "{{Lien}}?src=m4"),
              ("Pièce jointe", "Aucune")],
        subject="Avant le 31 décembre : votre soutien au Pab Fest compte sur 2026",
        subject_b="{{Prénom}}, il reste deux semaines pour votre exercice 2026",
        body=[
            "Bonjour {{Prénom}},",
            "Un mot rapide avant la fin de l'année : **un don versé avant le 31 décembre est déductible de votre exercice 2026** (pour les entreprises qui clôturent au 31/12).",
            "Concrètement, avec la réduction d'impôt de 60 % :",
            "- **La Pinte, 300 €** : votre nom et votre logo sur nos supports, pour un coût réel de **120 €** ;",
            "- **La Tournée, 500 €** : en plus, le panneau des soutiens, Instagram et une invitation à la soirée d'ouverture, pour **200 €** ;",
            "- **Le Fût, 1 000 €** : en plus, un post dédié et votre logo sur les t-shirts des bénévoles, pour **400 €**.",
            "👉 {{Lien}}?src=m4",
            "Le paiement prend deux minutes, et le reçu fiscal vous parvient automatiquement par email.",
            "Belles fêtes de fin d'année à toute l'équipe de {{Entreprise}},",
            "{{Signataire}}\n{{Téléphone}}",
        ],
        variants=[
            ("Contributeurs 2025 (mail 1)",
             "Remplacer la liste des paliers par : « Votre place de partenaire fidèle vous attend : le palier **{{PalierSuggéré}}** vous coûte réellement {{CoûtRéel}} € après réduction d'impôt. »"),
        ],
        todo=[
            "Mettre à jour la colonne « Statut » juste avant l'envoi (dons reçus depuis HelloAsso).",
        ],
    ),
    dict(
        n="5", name="Relance de janvier",
        meta=[("Pour qui", "Tous ceux qui n'ont toujours ni donné, ni répondu, ni écrit STOP"),
              ("Quand", "6 ou 7 janvier"),
              ("Signé par", "Même signataire"),
              ("Lien", "{{Lien}}?src=m5"),
              ("Pièce jointe", "Aucune")],
        subject="Bonne année ! Le Pab Fest 2027 compte sur {{Entreprise}}",
        subject_b="{{Prénom}}, une belle année 2027 et un festival à construire ensemble",
        body=[
            "Bonjour {{Prénom}},",
            "Toute l'équipe du Pab Fest vous souhaite une belle année 2027 !",
            "Je reviens vers vous au sujet de notre prochaine édition, du [dates 2027] sur l'île de Batz. En deux mots :",
            "- un soutien dès 50 €, avec un **reçu fiscal automatique** (nous sommes reconnus d'intérêt général) ;",
            "- **dès 300 €**, le nom et le logo de {{Entreprise}} sur le festival, pour un coût réel de 120 € ;",
            "- [déjà [nombre] entreprises du territoire à nos côtés pour 2027].",
            "👉 {{Lien}}?src=m5",
            "Une question ? Répondez simplement à ce mail, je vous réponds dans la journée.",
            "Bonne rentrée,",
            "{{Signataire}}\n{{Téléphone}}",
        ],
        variants=[
            ("Contributeurs 2025 (mail 1)",
             "Remplacer la liste par : « Votre nom manque encore à la liste de nos partenaires fidèles 2027, et nous aimerions beaucoup vous y voir. » Puis appel du référent dans la semaine."),
        ],
        todo=[
            "Indiquer les dates 2027 et le nombre de partenaires déjà engagés (supprimer la ligne si ce chiffre est faible).",
        ],
    ),
    dict(
        n="6", name="Relance de février",
        meta=[("Pour qui", "Tous ceux qui n'ont pas encore donné"),
              ("Quand", "2 ou 3 février")],
        subject="{{Prénom}}, les premiers partenaires du Pab Fest 2027 sont là",
        subject_b="",
        body=[
            "Bonjour {{Prénom}},",
            "Le Pab Fest 2027 prend forme : [première annonce de la programmation ou des brasseries invitées].",
            "Ils nous ont déjà rejoints : **[3 à 5 noms de partenaires 2027 confirmés]**.",
            "[Photo de l'édition 2025]",
            "Nous serions heureux d'y ajouter {{Entreprise}}. Dès 300 €, votre nom et votre logo figurent sur nos supports, pour un coût réel de 120 € après réduction d'impôt. Pour apparaître sur les affiches, il faut nous rejoindre avant le **[date d'impression]**.",
            "👉 {{Lien}}?src=m6",
            "Je reste joignable au {{Téléphone}} si vous voulez en parler.",
            "Belle journée,",
            "{{Signataire}}\n{{Téléphone}}",
        ],
        variants=[], todo=[],
    ),
]

GRID = [
    ("Don classique", "1 à 250 €", "Remerciement", "100 € pour 250 €"),
    ("La Pinte", "300 €", "Nom et logo sur les supports de communication", "120 €"),
    ("La Tournée (conseillée)", "500 €", "+ panneau des soutiens, Instagram, invitation à la soirée d'ouverture", "200 €"),
    ("Le Fût", "1 000 €", "+ post Instagram dédié, logo sur les t-shirts des bénévoles", "400 €"),
    ("Le Brasseur", "dès 2 000 €", "+ campagne sur mesure : scène à vos couleurs, concert à votre nom…", "dès 800 €"),
]

CONTRIB = [
    ("Lagadec TP", "1 000 €", "Le Brasseur, dès 2 000 €", "Grands partenaires"),
    ("Constructions Paugam", "800 €", "Le Fût 1 000 € ou Brasseur", "Grands partenaires"),
    ("Ty Coz Couverture", "710 €", "Le Fût 1 000 € ou Brasseur", "Grands partenaires"),
    ("Empereur", "700 €", "Le Fût 1 000 € ou Brasseur", "Grands partenaires"),
    ("Jardin Service", "500 €", "Le Fût 1 000 €", "Standard"),
    ("LVL Agencement", "300 €", "La Tournée 500 €", "Standard"),
    ("Le Coz Couv", "300 €", "La Tournée 500 €", "Standard, après envoi du reçu 2025"),
    ("Maison Ty Nevez", "300 €", "La Tournée 500 €", "Standard, après envoi du reçu 2025 (email à trouver)"),
    ("Studio In Situ", "200 €", "La Pinte 300 €", "Standard"),
    ("Crédit Agricole du Finistère", "150 €", "La Pinte 300 €", "Standard"),
    ("A L'Aise Breizh", "150 t-shirts", "En nature + La Tournée", "En nature"),
    ("Eurovia", "300 € promis", "La Tournée 500 € (ou 300 €)", "Non finalisé"),
    ("Beach Break", "200 € promis", "La Pinte 300 €", "Non finalisé"),
    ("Café Ty Pierre", "200 € promis", "La Pinte 300 €", "Non finalisé"),
    ("JP Berton / EDF", "200 € validés", "La Pinte 300 €", "Non finalisé"),
]

DECISIONS = [
    "**Taux de réduction** : 60 % pour les entreprises, à confirmer par le trésorier avant tout envoi.",
    "**Signataires** : qui signe les mails 1 (présidence) et 2 à 6 (responsable partenariats) ? Quel numéro de téléphone ?",
    "**Refus 2025** : les 12 entreprises qui ont refusé reçoivent-elles le mail 3 ? (proposition : non)",
    "**Date limite de février** (mail 6), liée à l'impression des supports.",
    "**Reçu pour le don en nature** d'A L'Aise Breizh : possible ou non ?",
    "**Mention « Partenaire fidèle depuis 2025 »** et premier choix de visibilité : l'équipe s'y engage-t-elle ?",
]

MERGE = "{{Prénom}} {{Entreprise}} {{Montant2025}} {{PalierSuggéré}} {{MontantPalier}} {{CoûtRéel}} {{ContrepartiesEnPlus}} {{JourAppel}} {{Lien}} {{Signataire}} {{Téléphone}}"


BRAND = "#1d4e89"; MAIL_BG = "#f7f7f5"


def inline(s):
    s = html.escape(s, quote=False)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"(?<!\*)\*(?!\*)(.+?)\*", r"<i>\1</i>", s)
    return s


def table(rows, head):
    td = 'padding:6px;border:1px solid #c9d2dd;vertical-align:top'
    t = ['<table style="border-collapse:collapse;width:100%"><tr>']
    t += [f'<td style="{td};background:{BRAND};color:#fff;font-weight:bold">{inline(h)}</td>' for h in head]
    t.append("</tr>")
    for r in rows:
        t.append("<tr>" + "".join(f'<td style="{td}">{inline(c)}</td>' for c in r) + "</tr>")
    return "".join(t) + "</table>"


def body_html(paras):
    out = []; ul = []
    def flush():
        if ul:
            out.append("<ul>" + "".join(f"<li>{inline(x)}</li>" for x in ul) + "</ul>"); ul.clear()
    for p in paras:
        if p.startswith("- "):
            ul.append(p[2:]); continue
        flush()
        out.append("<p>" + "<br>".join(inline(l) for l in p.split("\n")) + "</p>")
    flush()
    return "".join(out)


# ─── Rendu simple ───────────────────────────────────────────────────────
def md():
    o = [f"# {TITLE}", "", "Version du 21/11/2026, à valider par l'équipe.", "",
         "| N° | Mail | Pour qui | Contacts | Envoi |", "|---|---|---|---|---|"]
    o += [f"| {a} | **{b}** | {c} | **{d}** | {e} |" for a, b, c, d, e in RECAP]
    o.append("| | **Total** | | **213 entreprises** | |")
    for m, r in zip(MAILS, RECAP):
        o += ["", "---", "", f"## Mail {r[0]} · {r[1]}", "",
              f"**Pour qui** : {r[2]}  \n**Nombre de contacts** : {r[3]}  ", f"**Quand** : {r[4]}  ", f"**Objet** : {m['subject']}", ""]
        for p in m["body"]:
            o += [f"> {l}" for l in p.split("\n")] + [">"]
        o.pop()
    return "\n".join(o) + "\n"


def page():
    h = [f"<html><head><meta charset='utf-8'><title>{html.escape(TITLE)}</title></head><body style='font-family:Arial;font-size:11pt'>"]
    h.append(f"<h1 style='color:{BRAND}'>{inline(TITLE)}</h1>")
    h.append("<p>Version du 21/11/2026, à valider par l'équipe. Vos remarques : directement en commentaire dans ce document.</p>")
    h.append(table([[a, f"**{b}**", c, f"**{d}**", e] for a, b, c, d, e in RECAP] + [["", "**Total**", "", "**213 entreprises**", ""]],
                   ["N°", "Mail", "Pour qui", "Contacts", "Envoi"]))
    for m, r in zip(MAILS, RECAP):
        h.append('<p style="page-break-before:always"></p>')
        h.append(f"<h2 style='color:{BRAND}'>Mail {r[0]} · {inline(r[1])}</h2>")
        h.append(f"<p><b>Pour qui :</b> {inline(r[2])}<br><b>Nombre de contacts :</b> {r[3]}<br><b>Quand :</b> {inline(r[4])}<br><b>Objet :</b> {inline(m['subject'])}</p>")
        h.append(f'<table style="border-collapse:collapse;width:100%"><tr><td style="background:{MAIL_BG};border:1px solid #c9d2dd;border-left:4px solid {BRAND};padding:12px">{body_html(m["body"])}</td></tr></table>')
    h.append("</body></html>")
    return "".join(h)


if __name__ == "__main__":
    open(sys.argv[1], "w").write(md())
    open(sys.argv[2], "w").write(page())
