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

SIG = "Raphael PETIT\nSecrétaire général\nAssociation Mignoned Ar Pab\n07 67 67 83 24\nmignonedarpab@gmail.com\nhttps://www.instagram.com/pab_fest/"
FISCAL = "Les dons sont déductibles fiscalement : en tant qu'entreprise, vous bénéficiez d'une réduction d'impôt égale à 60 % du montant de votre don, dans la limite de 20 000 € ou de 0,5 % de votre chiffre d'affaires annuel hors taxes (le montant le plus élevé étant retenu). Le reçu fiscal vous est envoyé automatiquement."
FORMULES = [
    "- **La Pinte (300 €)** : votre logo sur nos supports de communication (affiches, flyers, site web, réseaux sociaux) ;",
    "- **La Tournée (500 €)** : en plus, le panneau des partenaires sur le festival, une publication Instagram et une invitation à la soirée d'ouverture ;",
    "- **Le Fût (1 000 €)** : en plus, une publication dédiée et votre logo sur les t-shirts des bénévoles ;",
    "- **Le Brasseur (dès 2 000 €)** : une présence sur mesure, jusqu'à une scène à vos couleurs.",
]

MAILS = [
    dict(n="1", subject="Merci pour 2025 : rejoignez-nous à nouveau pour le PAB FEST 2027", body=[
        "Bonjour {{Prénom}},",
        "En 2025, {{Entreprise}} a fait partie des partenaires qui ont rendu possible la 2e édition du PAB FEST sur l'Île de Batz. Au nom de toute l'association Mignoned Ar Pab, merci encore pour votre confiance.",
        "Grâce à vous, [nombre] festivaliers ont profité de trois jours de musique, de bière artisanale et de culture bretonne, en entrée libre, et votre logo a été vu sur [affiches, flyers, réseaux sociaux, panneau des partenaires].",
        "Nous préparons aujourd'hui l'édition 2027, qui se tiendra du [dates] juin 2027, et nous tenions à vous en parler **avant d'ouvrir notre campagne de partenariat**. Vous êtes un acteur clé de notre réseau local, et nous serions honorés de vous compter à nouveau parmi nos partenaires.",
        "Pour 2027, nous vous proposons la formule **{{PalierSuggéré}}** ({{MontantPalier}} €), qui renforce votre visibilité. Grâce à la réduction d'impôt de 60 %, elle vous revient réellement à **{{CoûtRéel}} €**. Et un don versé avant le 31 décembre compte sur votre exercice 2026.",
        "Vous pouvez renouveler votre soutien en deux minutes ici : {{Lien}}?src=m1",
        "Je vous propose de vous appeler dans les prochains jours pour en parler. N'hésitez pas non plus à me joindre directement au 07 67 67 83 24.",
        "Avec tous nos remerciements pour votre fidélité,",
        "Cordialement,",
        SIG,
    ]),
    dict(n="2", subject="De la part d'Eric Grall : devenez partenaire du PAB FEST 2027", body=[
        "Bonjour {{Prénom}},",
        "Eric Grall m'a conseillé de prendre contact avec vous : il m'a dit combien {{Entreprise}} était attachée à la vie de notre territoire.",
        "Je me permets donc de vous présenter le **PAB FEST**, le festival organisé par l'association Mignoned Ar Pab, qui se tiendra du [dates] juin 2027 sur l'Île de Batz. Cet événement célèbre la culture bretonne à travers la musique, la bière artisanale et l'art sous toutes ses formes, et il fait vivre toute l'île : commerces, hébergeurs, traversée depuis Roscoff.",
        "En tant qu'entrepreneur local et acteur important de notre réseau, nous serions heureux de vous compter parmi nos partenaires. Vous pourriez bénéficier :",
        "- de la présence de votre logo sur nos supports de communication (affiches, flyers, site web, réseaux sociaux) ;",
        "- d'une visibilité sur place, grâce au panneau des partenaires et à des espaces dédiés ;",
        "- de l'association de votre entreprise à un événement convivial, symbole de dynamisme et de savoir-faire local.",
        FISCAL,
        "Vous trouverez en pièce jointe notre dossier de partenariat, qui détaille les différentes formules. Je vous appellerai dans les prochains jours pour en discuter ; vous pouvez aussi me joindre au 07 67 67 83 24.",
        "Avec tous nos remerciements pour votre considération,",
        "Cordialement,",
        SIG,
    ]),
    dict(n="3", subject="Devenez partenaire du PAB FEST 2027 sur l'Île de Batz", body=[
        "Madame, Monsieur,",
        "Nous avons le plaisir de vous présenter le **PAB FEST**, un festival unique organisé par l'association Mignoned Ar Pab, qui se tiendra du [dates] juin 2027 sur l'Île de Batz. Cet événement, véritable célébration de la culture bretonne, met à l'honneur la musique, la bière artisanale et l'art sous toutes ses formes, dans un cadre exceptionnel et en entrée libre.",
        "Devenir partenaire du PAB FEST vous permettra de :",
        "- associer votre image à un événement convivial et inclusif, symbole de dynamisme et de savoir-faire local ;",
        "- bénéficier d'une forte visibilité sur nos supports de communication et pendant le festival ;",
        "- contribuer au rayonnement de la culture bretonne et à la vie de l'île ;",
        "- profiter des avantages fiscaux du mécénat : une réduction d'impôt de 60 % du montant de votre don, dans la limite de 20 000 € ou de 0,5 % de votre chiffre d'affaires hors taxes.",
        "Nos formules de partenariat :",
        *FORMULES,
        "Vous trouverez en pièce jointe notre dossier de partenariat. Pour nous soutenir directement : {{Lien}}?src=m3",
        "Nous restons à votre disposition pour échanger sur une formule adaptée à vos besoins, au 07 67 67 83 24.",
        "Nous espérons vivement que vous partagerez notre enthousiasme pour ce projet et que vous accepterez de nous accompagner dans cette belle aventure.",
        "Cordialement,",
        SIG,
    ]),
    dict(n="4", subject="Avant le 31 décembre : votre soutien au PAB FEST compte sur 2026", body=[
        "Bonjour,",
        "J'espère que vous allez bien. Je reviens vers vous au sujet de notre proposition de partenariat pour le PAB FEST 2027, qui se tiendra du [dates] juin 2027 sur l'Île de Batz.",
        "Un point qui peut vous intéresser avant la fin de l'année : **un don versé avant le 31 décembre est déductible sur votre exercice 2026**. Avec la réduction d'impôt de 60 %, une formule à 300 € vous revient réellement à 120 €, et une formule à 500 € à 200 €.",
        "Pour nous soutenir en deux minutes : {{Lien}}?src=m4",
        "N'hésitez pas à me contacter directement au 07 67 67 83 24 pour échanger ou pour confirmer votre engagement.",
        "Je vous souhaite de belles fêtes de fin d'année.",
        "Cordialement,",
        SIG,
    ]),
    dict(n="5", subject="Bonne année ! Rejoignez-nous pour le PAB FEST 2027", body=[
        "Bonjour,",
        "Toute l'équipe de Mignoned Ar Pab vous souhaite une très belle année 2027 !",
        "Je reviens vers vous au sujet de notre proposition de partenariat pour le PAB FEST 2027, qui se tiendra du [dates] juin 2027 sur l'Île de Batz. Nous serions honorés de vous compter parmi nos partenaires.",
        "Vous êtes un acteur de notre réseau local, et votre soutien contribuerait directement au succès de cette nouvelle édition. Je vous rappelle également que les dons sont déductibles fiscalement, ce qui constitue un avantage supplémentaire ;)",
        "Pour nous soutenir : {{Lien}}?src=m5",
        "Nous serions ravis de discuter des différentes formules et de répondre à vos questions. N'hésitez pas à me contacter directement au 07 67 67 83 24.",
        "Merci d'avance pour votre soutien et votre retour.",
        "Cordialement,",
        SIG,
    ]),
    dict(n="6", subject="Rejoignez nos premiers partenaires du PAB FEST 2027", body=[
        "Bonjour,",
        "J'espère que vous allez bien depuis notre dernier échange.",
        "Le PAB FEST 2027 prend forme : [première annonce de la programmation ou des brasseries invitées]. Plusieurs entreprises du territoire nous ont déjà rejoints, dont [3 à 5 noms de partenaires confirmés].",
        "Nous serions heureux d'y ajouter votre entreprise. Pour figurer sur nos affiches et nos flyers, il suffit de nous rejoindre avant le **[date d'impression]**. Les dons restent déductibles fiscalement à 60 %.",
        "Pour nous soutenir : {{Lien}}?src=m6",
        "N'hésitez pas à me contacter directement au 07 67 67 83 24 pour échanger sur ce projet ou pour confirmer votre engagement.",
        "Merci d'avance pour votre soutien et votre retour.",
        "Cordialement,",
        SIG,
    ]),
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
    o = [f"# {TITLE}", "", "Version du 21/11/2026, à valider par l'équipe. Les textes reprennent le ton et les formulations des mails envoyés en 2025.", "",
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
    h.append("<p>Version du 21/11/2026, à valider par l'équipe. Les textes reprennent le ton et les formulations des mails envoyés en 2025. Vos remarques : directement en commentaire dans ce document.</p>")
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
