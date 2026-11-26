import openpyxl,sys,copy,re
from openpyxl.utils import get_column_letter
base,clients,out=sys.argv[1:4]
wb=openpyxl.load_workbook(base); ws=wb['Base à contacter (emails)']
cl=openpyxl.load_workbook(clients,data_only=True)
DATE='25/11/2026'; EG='Oui – très chaud'
# nouvelles colonnes W et X
for col,title in ((23,'Client brasserie PAB'),(24,'Mail personnalisé (liste PAB)')):
    c=ws.cell(1,col); c.value=title; c._style=copy.copy(ws.cell(1,22)._style)
    ws.column_dimensions[get_column_letter(col)].width=22
tpl=227  # ligne modèle : contact Eric Grall priorité 1
GENERIC=('contact@','shop@','bieres@','hb535','hb8e4','local29680','gdb.bar','lokal.brest','bds.carantec','kalod@','sarltontonmalt','vins.gourmands','petite.epicerie','lesvinsomur','lesdelicesdetylou','linstinctbreton','cafetypierre','beachbreak','lenorway','tycoz.bistro','lenautilus','letempo','vagaboutik','lagouldo')
def type_mail(m): return 'Générique' if any(m.lower().startswith(g) or g in m.lower() for g in GENERIC) else 'Nominatif / direct'
def secteur(tab,nom):
    n=nom.lower()
    if 'hotel' in n: return 'Hébergement'
    if 'crêpe' in n or 'auberge' in n: return 'Restauration'
    if 'boucherie' in n: return 'Commerce de détail'
    return 'Bar' if tab.startswith('Bars') else 'Caviste / épicerie fine'
EXIST={'cafetypierre@orange.fr':146,'beachbreakdossen@gmail.com':19,'vagaboutik@gmail.com':200}
last=max(r for r in range(2,ws.max_row+1) if ws.cell(r,3).value)
num=int(ws.cell(last,1).value or last-1)
added=[];updated=[]
for t in cl:
    kind='Bar' if t.title.startswith('Bars') else 'Caviste'
    for r in t.iter_rows(min_row=1):
        nom,ville,mail,perso=[c.value for c in r[:4]]
        if not nom or nom in ('Client',) or not isinstance(nom,str): continue
        nom=nom.strip(); mail=(mail or '').strip(); perso=perso or 'À définir'
        origine=f'Clients brasserie PAB ({DATE}) – {t.title} L{r[0].row}'
        note=f'Client de la brasserie PAB ({kind.lower()}) – réseau Eric Grall, liste du {DATE} ; mail personnalisé : {perso}'
        if mail.lower() in EXIST:
            rn=EXIST[mail.lower()]
            ws.cell(rn,2).value='1 - Haute'; ws.cell(rn,4).value=EG
            if rn==19 and ws.cell(rn,5).value=='Prospects 2025 (autres)': ws.cell(rn,5).value='Santec'
            ws.cell(rn,19).value=((ws.cell(rn,19).value or '')+' | '+note).strip(' |')
            ws.cell(rn,23).value=kind; ws.cell(rn,24).value=perso
            for c in range(1,25): ws.cell(rn,c)._style=copy.copy(ws.cell(tpl,c)._style) if c not in (20,21) else ws.cell(rn,c)._style
            updated.append((rn,ws.cell(rn,3).value)); continue
        row=ws.max_row+1 if ws.cell(ws.max_row,3).value else next(i for i in range(last+1,ws.max_row+2) if not ws.cell(i,3).value)
        last=row; num+=1
        vals={1:num,2:'1 - Haute',3:nom.upper(),4:EG,5:ville,6:secteur(t.title,nom),7:mail,8:type_mail(mail),9:'OK',
              13:'À contacter',17:"Client de la brasserie PAB : mail personnalisé qui part du lien commercial (« vous servez déjà nos bières »), proposer La Pinte ou La Tournée, et l'affichage du festival dans le point de vente",
              19:note,22:origine,23:kind,24:perso}
        for c in range(1,25):
            ws.cell(row,c)._style=copy.copy(ws.cell(tpl,c)._style); ws.cell(row,c).value=vals.get(c)
        added.append((row,nom,ville))
# filtre étendu
if ws.auto_filter.ref:
    ws.auto_filter.ref=re.sub(r'^([A-Z]+1):[A-Z]+(\d+)$',lambda m:f'{m.group(1)}:X{last}',ws.auto_filter.ref)
wb.save(out)
print('mis à jour:',updated); print('ajoutés:',len(added)); [print(' ',a) for a in added]; print('filtre:',ws.auto_filter.ref,'dernière ligne',last)
