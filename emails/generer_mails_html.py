"""Génère les 6 mails de la campagne 2027 en HTML (Gmail), à partir des textes du Drive (T1 inspirée de 2025).
Usage : python3 emails/generer_mails_html.py emails/MAILS-CAMPAGNE-2027.html
"""
import html, re, sys

FORM = "https://www.helloasso.com/associations/mignoned-ar-pab/formulaires/4"
BANNER = "https://raw.githubusercontent.com/Gintho/PabFest/main/assets/banniere-entreprises.jpg"
NUIT, CREME, JAUNE, ORANGE, GRIS = "#1F282A", "#F0ECE2", "#E8E358", "#B5501C", "#6b6250"

PALIERS = [  # repris du formulaire HelloAsso n°4
    ("La Pinte", "300 €", "120 €", "Votre logo sur nos affiches, flyers, site et réseaux sociaux.", "Finance l'accueil des brasseurs artisanaux.", False),
    ("La Tournée", "500 €", "200 €", "Votre logo, le panneau des partenaires, une publication Instagram et une invitation à la soirée d'ouverture.", "Finance le cachet des artistes.", True),
    ("Le Fût", "1 000 €", "400 €", "Tout La Tournée, plus une publication dédiée et votre logo sur les t-shirts des bénévoles.", "Finance la scène, le son et la lumière.", False),
    ("Le Brasseur", "dès 2 000 €", "dès 800 €", "Une présence sur mesure : scène à vos couleurs, bâche ou concert à votre nom.", "Finance une soirée complète du festival.", False),
]

MAILS = [
    dict(n=1, nom="Contributeurs 2025", qui="15 entreprises qui ont soutenu le PAB FEST en 2025", quand="Semaine du 23 novembre",
         objet="Merci pour 2025 : rejoignez-nous à nouveau pour le PAB FEST 2027",
         bouton="Renouveler mon soutien", sous="Paiement sécurisé par HelloAsso · 2 minutes",
         avant=[
            "Bonjour {{Prénom}},",
            "En 2025, {{Entreprise}} a fait partie des partenaires qui ont rendu possible la 2e édition du **PAB FEST** sur l'Île de Batz. Au nom de toute l'association Mignoned Ar Pab, merci encore pour votre confiance.",
            "Grâce à vous, [nombre] festivaliers ont profité de trois jours de musique, de bière artisanale et de culture bretonne, en entrée libre, et votre logo a été vu sur [affiches, flyers, réseaux sociaux, panneau des partenaires].",
            "Nous préparons aujourd'hui l'édition 2027, qui se tiendra du [dates] juin 2027, et nous tenions à vous en parler **avant d'ouvrir notre campagne de partenariat**. Vous êtes un acteur clé de notre réseau local, et nous serions honorés de vous compter à nouveau parmi nos partenaires.",
            "Pour 2027, nous vous proposons la formule **{{PalierSuggéré}}** ({{MontantPalier}} €), qui renforce votre visibilité. Grâce à la réduction d'impôt de 60 %, elle vous revient réellement à **{{CoûtRéel}} €**. Et un don versé avant le 31 décembre compte sur votre exercice 2026.",
         ], paliers=False,
         apres=[
            "Je vous propose de vous appeler dans les prochains jours pour en parler. N'hésitez pas non plus à me joindre directement au **07 67 67 83 24**.",
            "Avec tous nos remerciements pour votre fidélité,",
         ]),
    dict(n=2, nom="Contacts d'Eric Grall", qui="13 entreprises recommandées par Eric Grall", quand="Fin novembre, appel 48 h après",
         objet="De la part d'Eric Grall : devenez partenaire du PAB FEST 2027",
         bouton="Découvrir nos formules de partenariat", sous="Paiement sécurisé par HelloAsso · dès 300 €",
         avant=[
            "Bonjour {{Prénom}},",
            "Eric Grall m'a conseillé de prendre contact avec vous : il m'a dit combien {{Entreprise}} était attachée à la vie de notre territoire.",
            "Je me permets donc de vous présenter le **PAB FEST**, le festival organisé par l'association Mignoned Ar Pab, qui se tiendra du [dates] juin 2027 sur l'Île de Batz. Cet événement célèbre la culture bretonne à travers la musique, la bière artisanale et l'art sous toutes ses formes, et il fait vivre toute l'île : commerces, hébergeurs, traversée depuis Roscoff.",
            "En tant qu'entrepreneur local et acteur important de notre réseau, nous serions heureux de vous compter parmi nos partenaires. Vous pourriez bénéficier :",
            "- de la présence de votre logo sur nos supports de communication (affiches, flyers, site web, réseaux sociaux) ;",
            "- d'une visibilité sur place, grâce au panneau des partenaires et à des espaces dédiés ;",
            "- de l'association de votre entreprise à un événement convivial, symbole de dynamisme et de savoir-faire local.",
            "Les dons sont déductibles fiscalement : en tant qu'entreprise, vous bénéficiez d'une **réduction d'impôt de 60 %** du montant de votre don, dans la limite de 20 000 € ou de 0,5 % de votre chiffre d'affaires hors taxes. Le reçu fiscal vous est envoyé automatiquement.",
         ], paliers=False,
         apres=[
            "Je vous appellerai dans les prochains jours pour en discuter ; vous pouvez aussi me joindre au **07 67 67 83 24**.",
            "Avec tous nos remerciements pour votre considération,",
         ]),
    dict(n=3, nom="Toute la base", qui="185 entreprises de la base", quand="1er au 3 décembre, en 3 lots",
         objet="Devenez partenaire du PAB FEST 2027 sur l'Île de Batz",
         bouton=None, sous=None,
         avant=[
            "Madame, Monsieur,",
            "Nous avons le plaisir de vous présenter le **PAB FEST**, un festival unique organisé par l'association Mignoned Ar Pab, qui se tiendra du [dates] juin 2027 sur l'Île de Batz. Cet événement, véritable célébration de la culture bretonne, met à l'honneur la musique, la bière artisanale et l'art sous toutes ses formes, dans un cadre exceptionnel et en entrée libre.",
            "Devenir partenaire du PAB FEST vous permettra de :",
            "- associer votre image à un événement convivial et inclusif, symbole de dynamisme et de savoir-faire local ;",
            "- bénéficier d'une forte visibilité sur nos supports de communication et pendant le festival ;",
            "- contribuer au rayonnement de la culture bretonne et à la vie de l'île ;",
            "- profiter des avantages fiscaux du mécénat : une **réduction d'impôt de 60 %** du montant de votre don, dans la limite de 20 000 € ou de 0,5 % de votre chiffre d'affaires hors taxes.",
            "**Choisissez votre formule** (coût réel après réduction d'impôt) :",
         ], paliers=True,
         apres=[
            "Nous restons à votre disposition pour échanger sur une formule adaptée à vos besoins, au **07 67 67 83 24**.",
            "Nous espérons vivement que vous partagerez notre enthousiasme pour ce projet et que vous accepterez de nous accompagner dans cette belle aventure.",
         ]),
    dict(n=4, nom="Relance clôture 2026", qui="Tous ceux qui n'ont pas encore donné", quand="14 ou 15 décembre",
         objet="Avant le 31 décembre : votre soutien au PAB FEST compte sur 2026",
         bouton="Soutenir le PAB FEST avant le 31/12", sous="Paiement sécurisé par HelloAsso · 2 minutes",
         avant=[
            "Bonjour,",
            "J'espère que vous allez bien. Je reviens vers vous au sujet de notre proposition de partenariat pour le PAB FEST 2027, qui se tiendra du [dates] juin 2027 sur l'Île de Batz.",
            "Un point qui peut vous intéresser avant la fin de l'année : **un don versé avant le 31 décembre est déductible sur votre exercice 2026**. Avec la réduction d'impôt de 60 %, une formule à 300 € vous revient réellement à 120 €, et une formule à 500 € à 200 €.",
         ], paliers=False,
         apres=[
            "N'hésitez pas à me contacter directement au **07 67 67 83 24** pour échanger ou pour confirmer votre engagement.",
            "Je vous souhaite de belles fêtes de fin d'année.",
         ]),
    dict(n=5, nom="Relance de janvier", qui="Tous ceux qui n'ont pas encore donné", quand="6 ou 7 janvier",
         objet="Bonne année ! Rejoignez-nous pour le PAB FEST 2027",
         bouton="Rejoindre les partenaires 2027", sous="Paiement sécurisé par HelloAsso · dès 300 €",
         avant=[
            "Bonjour,",
            "Toute l'équipe de Mignoned Ar Pab vous souhaite une très belle année 2027 !",
            "Je reviens vers vous au sujet de notre proposition de partenariat pour le PAB FEST 2027, qui se tiendra du [dates] juin 2027 sur l'Île de Batz. Nous serions honorés de vous compter parmi nos partenaires.",
            "Vous êtes un acteur de notre réseau local, et votre soutien contribuerait directement au succès de cette nouvelle édition. Je vous rappelle également que les dons sont déductibles fiscalement, ce qui constitue un avantage supplémentaire ;)",
         ], paliers=False,
         apres=[
            "Nous serions ravis de discuter des différentes formules et de répondre à vos questions. N'hésitez pas à me contacter directement au **07 67 67 83 24**.",
            "Merci d'avance pour votre soutien et votre retour.",
         ]),
    dict(n=6, nom="Relance de février", qui="Tous ceux qui n'ont pas encore donné", quand="2 ou 3 février",
         objet="Rejoignez nos premiers partenaires du PAB FEST 2027",
         bouton="Figurer sur nos affiches 2027", sous="Paiement sécurisé par HelloAsso · dès 300 €",
         avant=[
            "Bonjour,",
            "J'espère que vous allez bien depuis notre dernier échange.",
            "Le PAB FEST 2027 prend forme : [première annonce de la programmation ou des brasseries invitées]. Plusieurs entreprises du territoire nous ont déjà rejoints, dont [3 à 5 noms de partenaires confirmés].",
            "Nous serions heureux d'y ajouter votre entreprise. Pour figurer sur nos affiches et nos flyers, il suffit de nous rejoindre avant le **[date d'impression]**. Les dons restent déductibles fiscalement à 60 %.",
         ], paliers=False,
         apres=[
            "N'hésitez pas à me contacter directement au **07 67 67 83 24** pour échanger sur ce projet ou pour confirmer votre engagement.",
            "Merci d'avance pour votre soutien et votre retour.",
         ]),
]

P = f"margin:0 0 14px;"
TXT = f"font-size:15px;line-height:1.6;color:{NUIT};"


def inline(s):
    s = html.escape(s, quote=False)
    return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)


def paras(lines):
    out, ul = [], []
    def flush():
        if ul:
            rows = "".join(f'<tr><td width="24" valign="top" style="color:{ORANGE};font-weight:bold;">✓</td><td style="padding-bottom:6px;">{inline(x)}</td></tr>' for x in ul)
            out.append(f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="{TXT}margin:0 0 14px;">{rows}</table>')
            ul.clear()
    for l in lines:
        if l.startswith("- "):
            ul.append(l[2:]); continue
        flush(); out.append(f'<p style="{P}">{inline(l)}</p>')
    flush()
    return "".join(out)


def bouton(label, sous, href=FORM):
    return (f'<tr><td align="center" style="padding:6px 32px 18px;">'
            f'<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="{NUIT}" style="border-radius:6px;">'
            f'<a href="{href}" style="display:inline-block;padding:15px 34px;font:bold 17px Arial,Helvetica,sans-serif;color:{CREME};text-decoration:none;border-radius:6px;">{html.escape(label)}&nbsp;→</a>'
            f'</td></tr></table><p style="margin:10px 0 0;font-size:13px;color:{GRIS};">{html.escape(sous)}</p></td></tr>')


def paliers():
    out = []
    for nom, prix, cout, quoi, finance, top in PALIERS:
        brasseur = nom == "Le Brasseur"
        href = "mailto:mignonedarpab@gmail.com?subject=Partenariat%20Brasseur%20PAB%20FEST%202027" if brasseur else FORM
        lab = "En parler" if brasseur else "Choisir"
        if top:
            box = f'bgcolor="{NUIT}" style="background:{NUIT};border-radius:8px;"'; fg, sub, btn = CREME, "#c9c2b0", f"background:{JAUNE};color:{NUIT};"
            badge = f'<span style="display:inline-block;margin-bottom:4px;padding:2px 8px;background:{JAUNE};color:{NUIT};font:bold 11px Arial;border-radius:10px;">CONSEILLÉE</span><br>'
        else:
            box = 'style="border:1px solid #d9d3c4;border-radius:8px;"'; fg, sub, btn = NUIT, GRIS, f"background:{CREME};color:{NUIT};"; badge = ""
        out.append(
            f'<tr><td style="padding:6px 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" {box}><tr>'
            f'<td style="padding:14px 16px;font-size:14px;line-height:1.5;color:{fg};">{badge}<span style="font-size:16px;font-weight:bold;">{nom} · {prix}</span> '
            f'<span style="color:{sub};">(coût réel {cout})</span><br>{html.escape(quoi)}<br><span style="color:{sub};">{html.escape(finance)}</span></td>'
            f'<td width="110" align="right" valign="middle" style="padding:14px 16px 14px 0;"><a href="{href}" style="display:inline-block;padding:10px 14px;{btn}font:bold 14px Arial;text-decoration:none;border-radius:6px;white-space:nowrap;">{lab}&nbsp;→</a></td>'
            f'</tr></table></td></tr>')
    out.append(f'<tr><td style="padding:8px 32px 6px;font-size:13px;line-height:1.5;color:{GRIS};">Chaque bouton ouvre notre page sécurisée HelloAsso, où vous choisissez le montant. Le reçu fiscal arrive automatiquement par email, et un don versé avant le 31 décembre compte sur votre exercice 2026.</td></tr>')
    return "".join(out)


SIGNATURE = (f'<p style="margin:0 0 4px;">Cordialement,</p><p style="margin:0;font-size:14px;line-height:1.5;"><b>Raphael PETIT</b><br>Secrétaire général · Association Mignoned Ar Pab<br>'
             f'07 67 67 83 24 · <a href="mailto:mignonedarpab@gmail.com" style="color:{ORANGE};">mignonedarpab@gmail.com</a><br>'
             f'<a href="https://www.instagram.com/pab_fest/" style="color:{ORANGE};">Instagram @pab_fest</a></p>')


def mail(m):
    head = (f'<p style="max-width:600px;margin:0 auto 4px;font:bold 14px Arial;color:{NUIT};">MAIL {m["n"]} · {html.escape(m["nom"]).upper()}</p>'
            f'<p style="max-width:600px;margin:0 auto 4px;font:13px Arial;color:{GRIS};">Pour qui : {html.escape(m["qui"])} · Envoi : {html.escape(m["quand"])}</p>'
            f'<p style="max-width:600px;margin:0 auto 12px;font:13px Arial;color:{GRIS};"><b>Objet :</b> {html.escape(m["objet"])}</p>')
    body = [f'<tr><td><a href="{m.get('banner_href', FORM)}"><img src="{BANNER}" width="600" alt="PAB FEST 2027 · Devenez partenaire" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></a></td></tr>',
            f'<tr><td style="padding:28px 32px 4px;{TXT}">{paras(m["avant"])}</td></tr>']
    if m["paliers"]:
        body.append(paliers())
    if m["bouton"]:
        body.append(bouton(m["bouton"], m["sous"], m.get("href", FORM)))
    body.append(f'<tr><td style="padding:14px 32px 28px;{TXT}">{paras(m["apres"])}{SIGNATURE}</td></tr>')
    return (head + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">'
            f'<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">'
            + "".join(body) + '</table></td></tr></table><div style="height:56px;"></div>')


def page():
    intro = (f'<div style="max-width:600px;margin:0 auto 28px;font:14px/1.5 Arial;color:{NUIT};">'
             f'<h1 style="font-size:22px;margin:0 0 8px;">PAB FEST 2027 · Les 6 mails de la campagne, prêts pour Gmail</h1>'
             f'<p style="margin:0 0 8px;">Textes du Drive (version « T1 inspirée de 2025 »), mis en page avec la bannière et le lien vers la page entreprises HelloAsso (formulaire n°4).</p>'
             f'<p style="margin:0;"><b>Pour envoyer :</b> ouvrir ce fichier dans Chrome, sélectionner un mail de la bannière à la signature, copier, puis coller dans un nouveau message Gmail. Remplacer les [crochets] et les {{{{champs}}}} avant l\'envoi.</p></div>')
    return ('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            '<title>PAB FEST 2027 · 6 mails de la campagne</title></head>'
            '<body style="margin:0;padding:24px 0;background:#e9e6de;font-family:Arial,Helvetica,sans-serif;">'
            + intro + "".join(mail(m) for m in MAILS) + '</body></html>')


if __name__ == "__main__":
    open(sys.argv[1], "w", encoding="utf-8").write(page())
