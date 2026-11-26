"""Mail 1 (lancement) en 3 versions : Fidéliser, Personnaliser, Générique.
Réutilise la mise en page de generer_mails_html.py.
Usage : python3 emails/generer_mail1_3types.py emails/MAIL1-3-TYPES.html
"""
import importlib.util, pathlib, sys

_spec = importlib.util.spec_from_file_location("g", pathlib.Path(__file__).with_name("generer_mails_html.py"))
g = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(g)

g.MAILS = [
    dict(n="1-A", nom="Fidéliser", qui="Type d'email = « Fidéliser » : les 10 entreprises qui ont donné en 2025",
         quand="Semaine du 30 novembre, avant les autres. Appel 48 h après.",
         objet="{{Prénom}}, merci pour 2025 : vous êtes les premiers prévenus pour le PAB FEST 2027",
         bouton="Renouveler mon soutien", sous="Paiement sécurisé par HelloAsso · 2 minutes",
         avant=[
            "Bonjour {{Prénom}},",
            "En 2025, {{Entreprise}} a fait partie des partenaires qui ont rendu possible le **PAB FEST** sur l'Île de Batz. Au nom de toute l'association Mignoned Ar Pab, merci encore pour votre confiance.",
            "Grâce à vous, [nombre] festivaliers ont profité de trois jours de musique, de bière artisanale et de culture bretonne, en entrée libre, et votre logo a été vu sur [affiches, flyers, réseaux sociaux, panneau des partenaires].",
            "Nous préparons l'édition 2027, du [dates] juin, et nous tenions à vous en parler **avant d'ouvrir la campagne à tous**. Vous choisissez ainsi en premier votre formule et votre visibilité, avec la mention « Partenaire fidèle depuis 2025 ».",
            "Pour 2027, nous vous proposons la formule **{{PalierSuggéré}}** ({{MontantPalier}} €). Après la réduction d'impôt de 60 %, elle vous revient réellement à **{{CoûtRéel}} €**, et un don versé avant le 31 décembre compte sur votre exercice 2026. Renouveler au même montant qu'en 2025 reste bien sûr possible.",
         ], paliers=False,
         apres=[
            "Je vous appelle dans les prochains jours pour en parler. Vous pouvez aussi me joindre directement au **07 67 67 83 24**.",
            "Avec tous nos remerciements pour votre fidélité,",
         ]),
    dict(n="1-B", nom="Personnaliser", qui="Type d'email = « Personnaliser » : les 47 contacts du réseau d'Eric Grall et de la brasserie PAB",
         quand="Début décembre. Appel 48 h après.",
         objet="{{Prénom}}, Eric Grall m'a conseillé de vous écrire pour le PAB FEST 2027",
         bouton="Découvrir nos formules de partenariat", sous="Paiement sécurisé par HelloAsso · dès 300 €",
         avant=[
            "Bonjour {{Prénom}},",
            "Eric Grall, de la brasserie PAB sur l'Île de Batz, m'a conseillé de prendre contact avec vous : il connaît {{Entreprise}} et sait combien vous êtes attaché à la vie de notre territoire.",
            "[Pour les clients de la brasserie : Vous servez déjà nos bières, et c'est un peu de l'île que vous faites vivre chez vous. Nous serions heureux d'aller plus loin ensemble.]",
            "Le **PAB FEST**, organisé par l'association Mignoned Ar Pab, revient du [dates] juin 2027 sur l'Île de Batz : concerts, marché des brasseurs artisanaux bretons, tatoueurs et spectacle vivant, en entrée libre. Tout le week-end fait vivre l'île : commerces, hébergeurs, traversée depuis Roscoff.",
            "Pour cette édition, nous aimerions compter {{Entreprise}} parmi nos partenaires :",
            "- **votre logo** sur nos affiches, flyers, site et réseaux sociaux, dès 300 € ;",
            "- **une réduction d'impôt de 60 %** : 500 € vous reviennent réellement à 200 €, le reçu fiscal arrive automatiquement ;",
            "- **un don avant le 31 décembre** compte sur votre exercice 2026.",
         ], paliers=False,
         apres=[
            "Je vous appelle dans les prochains jours pour en parler cinq minutes ; vous pouvez aussi me joindre au **07 67 67 83 24**.",
            "Avec tous nos remerciements, et à bientôt sur l'île,",
         ]),
    dict(n="1-C1", nom="Générique · avec les offres", qui="Type d'email = « Générique » (148 entreprises) · à utiliser une fois les paliers validés",
         quand="Début décembre, en 2 lots de 74 (limite de 100 envois par jour sur Gmail).",
         objet="Devenez partenaire du PAB FEST 2027 sur l'Île de Batz",
         bouton=None, sous=None,
         avant=[
            "Madame, Monsieur,",
            "Nous avons le plaisir de vous présenter le **PAB FEST**, le festival organisé par l'association Mignoned Ar Pab, qui se tiendra du [dates] juin 2027 sur l'Île de Batz. Véritable célébration de la culture bretonne, il met à l'honneur la musique, la bière artisanale et l'art sous toutes ses formes, en entrée libre.",
            "Devenir partenaire du PAB FEST vous permettra de :",
            "- associer votre image à un événement convivial, symbole de dynamisme et de savoir-faire local ;",
            "- bénéficier d'une forte visibilité sur nos supports et pendant le festival ;",
            "- contribuer à la vie de l'île et au rayonnement de la culture bretonne ;",
            "- profiter d'une **réduction d'impôt de 60 %** du montant de votre don, dans la limite de 20 000 € ou de 0,5 % de votre chiffre d'affaires hors taxes.",
            "**Choisissez votre formule** (coût réel après réduction d'impôt) :",
         ], paliers=True,
         apres=[
            "Nous restons à votre disposition pour échanger sur une formule adaptée à vos besoins, au **07 67 67 83 24**.",
            "Nous espérons vivement que vous accepterez de nous accompagner dans cette belle aventure.",
         ]),
    dict(n="1-C2", nom="Générique · sans les offres", qui="Type d'email = « Générique » (148 entreprises) · pour lancer la prospection en attendant la validation des paliers",
         quand="Dès maintenant, en 2 lots de 74 (limite de 100 envois par jour sur Gmail).",
         objet="Devenez partenaire du PAB FEST 2027 sur l'Île de Batz",
         bouton="Échanger sur un partenariat",
         href="mailto:mignonedarpab@gmail.com?subject=Partenariat%20PAB%20FEST%202027",
         banner_href="https://www.instagram.com/pab_fest/",
         sous="Ou appelez-moi directement au 07 67 67 83 24",
         avant=[
            "Madame, Monsieur,",
            "Nous avons le plaisir de vous présenter le **PAB FEST**, le festival organisé par l'association Mignoned Ar Pab, qui se tiendra du [dates] juin 2027 sur l'Île de Batz. Véritable célébration de la culture bretonne, il met à l'honneur la musique, la bière artisanale et l'art sous toutes ses formes, en entrée libre.",
            "Le festival existe grâce aux entreprises du territoire qui le soutiennent, et nous serions heureux d'y associer la vôtre en 2027. Devenir partenaire du PAB FEST vous permettra de :",
            "- associer votre image à un événement convivial, symbole de dynamisme et de savoir-faire local ;",
            "- bénéficier d'une visibilité sur nos supports de communication (affiches, flyers, site, réseaux sociaux) et pendant le festival ;",
            "- contribuer à la vie de l'île et au rayonnement de la culture bretonne ;",
            "- profiter d'une **réduction d'impôt de 60 %** du montant de votre don, dans la limite de 20 000 € ou de 0,5 % de votre chiffre d'affaires hors taxes. Le reçu fiscal vous est envoyé automatiquement.",
            "Chaque partenariat se construit avec vous, selon votre budget et la visibilité que vous souhaitez. Et un don versé **avant le 31 décembre** compte sur votre exercice 2026.",
         ], paliers=False,
         apres=[
            "Il vous suffit de répondre à ce mail : je vous présente nos formules et nous voyons ensemble celle qui vous correspond.",
            "Nous espérons vivement que vous accepterez de nous accompagner dans cette belle aventure.",
         ]),
]

_page = g.page
def page():
    html = _page()
    return (html.replace("PAB FEST 2027 · Les 6 mails de la campagne, prêts pour Gmail", "PAB FEST 2027 · Mail 1 en 4 versions")
                .replace("Textes du Drive (version « T1 inspirée de 2025 »), mis en page avec la bannière et le lien vers la page entreprises HelloAsso (formulaire n°4).",
                         "Un premier mail par type d'email de la base : Fidéliser, Personnaliser, et Générique en 2 variantes (avec ou sans les offres). Lien vers la page entreprises HelloAsso (formulaire n°4)."))

if __name__ == "__main__":
    open(sys.argv[1], "w", encoding="utf-8").write(page())
