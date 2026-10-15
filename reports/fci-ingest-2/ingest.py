import csv,json,os,re,sys,hashlib,subprocess,shutil,urllib.request,difflib,collections
os.chdir('/workspace/fci')
MAP={'breast-milk':'breast-milk','freshwater-fish':'fish-freshwater','textiles-apparel-outdoor-gear':'textiles','fish-seafood-mixed':'seafood','produce-mixed':'produce-mixed',
'animal-origin-foods-mixed':'meat-and-poultry','beef-product':'meat-and-poultry','pork-product':'meat-and-poultry','poultry-product':'meat-and-poultry','processed-meats':'meat-and-poultry',
'canned-seafood':'canned-seafood','shellfish':'seafood','carpets-rugs-household-cleaners':'carpet-cleaners','cereal-grains':'cereal-grains','childrens-products':'childrens-products',
'cookware-nonstick-coated':'cookware-nonstick-coated','cosmetics-general':'cosmetics','dental-floss':'floss-interdental-cleaners','fresh-fruit':'produce-mixed','leafy-vegetables-other':'produce-mixed',
'non-root-vegetables':'produce-mixed','mascara':'eye-makeup','period-underwear':'period-underwear-reusable-garments','sunscreens':'sunscreens'}
TITLES={'breast-milk':'Breast milk','textiles':'Textiles, apparel and outdoor gear','produce-mixed':'Fruit and vegetables','meat-and-poultry':'Meat and poultry','cereal-grains':'Cereal grains','childrens-products':"Children's products",'cosmetics':'Cosmetics','sunscreens':'Sunscreens'}
AN={'PFOA':'pfoa','PFOS':'pfos','PFNA':'pfna','PFHxS':'pfhxs','PFBS':'pfbs','PFDA':'pfda','PFHxA':'pfhxa','HFPO-DA':'hfpo-da'}
UNIT=r'(ng/L|ng L-1|ng/mL|ng mL-1|pg/mL|pg mL-1|ng/g(?: ww| wet weight| dw)?|ng g-1|pg/g|pg g-1|[µμ]g/kg|[µμ]g kg-1|ng/kg|ng kg-1|[µμ]g/L|mg/kg|[µμ]g/m2|ng/cm2|[µμ]g/g)'
RX=re.compile(r'\b(PFOA|PFOS|PFNA|PFHxS|PFBS|PFDA|PFHxA|HFPO-DA)\b([^.;%]{0,45}?)(<\s*)?(\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?)\s*'+UNIT+r'(?![\w/])')
EXCL=re.compile(r'serum|plasma|blood|urine|cord|\bLOD|\bLOQ|MDL|MRL|detection limit|limit of|quantif|recover|spik|calibrat|guideline|tolerable|TDI|TWI|advisor|threshold|intake|\bbw\b|body weight|standard|EFSA|EPA|MCL|regulat|maximum level|partner|GenX|every lot|every batch|predicted|model|simulat|exposure|dose|\bEDI\b|ref\.|\[\d|reported (?:in|by)|previous|et al|literature|compar|higher than|lower than|pregnan|maternal|blank|cohort|participants|women|studies|irrigation',re.I)
MATRIX={'breast-milk':r'milk','freshwater-fish':r'fish|fillet|muscle|tissue|trout|perch|carp|eel|bass|pike|catfish|salmon','textiles-apparel-outdoor-gear':r'textile|fabric|jacket|garment|cloth|apparel|gear|sample','fish-seafood-mixed':r'fish|seafood|shellfish|mussel|shrimp|oyster|clam|squid|muscle|fillet|tissue|herring|cod|tuna|salmon','produce-mixed':r'fruit|vegetable|lettuce|crop|produce|plant|leaf|apple|tomato|berr|potato|cabbage'}
MATRIX.update({k:r'milk|meat|beef|pork|chicken|poultry|liver|muscle|egg|sausage|ham|food|sample|fish|seafood|grain|cereal|wheat|rice|fruit|vegetable|lettuce|crop|plant|floss|sunscreen|cosmetic|mascara|product|textile|fabric|carpet|rug|cleaner|cookware|pan|coating|underwear|garment|toy' for k in ['animal-origin-foods-mixed','beef-product','pork-product','poultry-product','processed-meats','canned-seafood','shellfish','carpets-rugs-household-cleaners','cereal-grains','childrens-products','cookware-nonstick-coated','cosmetics-general','dental-floss','fresh-fruit','leafy-vegetables-other','non-root-vegetables','mascara','period-underwear','sunscreens']})
GAPX=re.compile(r'\d|PF[A-Z]|HFPO|and|or|vs|than|to\b|from|below|above|up to|less|more|under|over|exceed|<|>',re.I)
STAT=re.compile(r'mean|median|maximum|max\b|highest|average|range|minimum|lowest|geometric',re.I)
def norm(s): return re.sub(r'\s+',' ',s.replace('−','-').replace('–','-').replace('‒','-').replace('\u2014','-').replace('\u00a0',' ').replace('\u2009',' ').replace('ﬁ','fi').replace('ﬂ','fl'))
def crossref(doi):
    try:
        m=json.load(urllib.request.urlopen(urllib.request.Request('https://api.crossref.org/works/'+doi,headers={'User-Agent':'fci-ingest (mailto:info@paleofoundation.com)'}),timeout=30))['message']
        return m
    except Exception: return None
def slugtitle(s): return re.sub(r'\W','',s.lower())
log=[];stats=collections.Counter();new_sources=[]
for folder in sys.argv[1:]:
    prod=MAP[folder]; d='/workspace/pfas-library/papers-'+folder
    rows={r['filename']:r for r in csv.DictReader(open(d+'/MANIFEST.csv',encoding='utf-8',errors='ignore'))}
    for fn in sorted(os.listdir(d)):
        if not fn.lower().endswith(('.pdf','.xml')): continue
        r=rows.get(fn,{}); slug=re.sub(r'[^a-z0-9-]','',fn.rsplit('.',1)[0].lower().replace('_','-'))
        def nf(why): log.append([folder,prod,fn,'NOT_FILED',why]); stats['not_filed']+=1
        if fn.endswith('.xml'): nf('XML record, no PDF'); continue
        if not r: nf('not in MANIFEST'); continue
        if os.path.exists(f'wiki/sources/{slug}.md'): nf('duplicate of existing source page'); continue
        m=re.search(r'10\.\d{4,9}/[^\s,"]+',r.get('DOI/URL','')+' '+r.get('citation',''))
        if not m: nf('no DOI in MANIFEST'); continue
        doi=m.group(0).rstrip('.').lower()
        pdf=d+'/'+fn; txt=subprocess.run(['pdftotext',pdf,'-'],capture_output=True,text=True,errors='ignore').stdout
        pages=[norm(p) for p in txt.split('\f')]; full=' '.join(pages)
        cr=crossref(doi)
        if not cr: nf(f'DOI {doi} did not resolve at Crossref'); continue
        title=norm((cr.get('title') or [''])[0]); title=re.sub(r'<[^>]+>','',title)
        indoi=doi in full.lower().replace(' ','')
        intitle=slugtitle(title)[:60] in slugtitle(' '.join(pages[:2]))
        if not (indoi or intitle): nf('neither DOI nor Crossref title found in PDF text'); continue
        authors=[norm((a.get('given','')+' '+a.get('family','')).strip()) or a.get('name','') for a in cr.get('author',[])]
        yr=((cr.get('issued') or {}).get('date-parts') or [[None]])[0][0]; pub=norm((cr.get('container-title') or [''])[0])
        if not (title and authors and yr and pub): nf('Crossref metadata incomplete'); continue
        fnd=[];seen=set();held=0
        for i,p in enumerate(pages):
            for sent in re.split(r'(?<=[a-z\)])\. (?=[A-Z])',p):
                if len(sent)>500: continue
                for mm in RX.finditer(sent):
                    a,gap,lt,val,unit=mm.groups()
                    if (mm.start()>0 and sent[mm.start()-1] in '-‐') or not STAT.search(sent[max(0,mm.start()-60):mm.start(4)]) or (folder!='breast-milk' and re.search(r'\bwater\b',sent,re.I)) or GAPX.search(gap) or EXCL.search(sent) or not re.search(MATRIX[folder],sent,re.I) or re.match(r'\s*(?:[a-z.]+\s*)?-\s*\d',sent[mm.end():]) or re.search(r'-\s*$',sent[:mm.start(4)]): held+=1; continue
                    v=(lt.strip() if lt else '')+val; key=(a,v,unit)
                    if key in seen: continue
                    seen.add(key)
                    clause=norm(sent[max(0,mm.start()-80):mm.end()+40]).replace('|','/').replace('"',"'")
                    first=' '.join(sent.split()[:7]).replace('"',"'").replace('|','/')
                    fnd.append({'product':prod,'analyte':AN[a],'value':v,'unit':unit,'basis':f'Stated in source text: "...{clause}..."','source_location':f'PDF p.{i+1}, sentence beginning "{first}"'})
        fnd=fnd[:40]
        os.makedirs(f'raw/fci-ingest-2/{folder}',exist_ok=True); rp=f'raw/fci-ingest-2/{folder}/{fn}'; shutil.copy(pdf,rp)
        sha=hashlib.sha256(open(rp,'rb').read()).hexdigest()
        fm={'draft':False,'type':'source','cite_key':slug,'title':title,'authors':authors,'year':yr,'publication':pub,'doi':doi,'no_doi_assigned':False,
            'source_type':'primary_measurement' if 'PRIMARY' in r.get('tier','') else 'context','evidence_tier':'reviewed','evidence_fitness':norm(r.get('relevance','')),
            'public_evidence_label':'Source-reported measurements' if fnd else 'Context source','review_state':'approved_for_public','confidence':'reviewed',
            'claim_classes':[],'raw_path':rp,'sha256':sha,'access_date':'2026-10-15','access_url':r.get('OA_url') or f'https://doi.org/{doi}','license':r.get('access',''),
            'metals':[],'analytes':sorted(set(f['analyte'] for f in fnd)),'ingredients':[],'products':[prod],'jurisdictions':[],'superseded_by':None,'updated':'2026-10-15','findings':fnd,
            'library_folder':folder,'unpublished_candidate_matches':held}
        def c(x): return str(x).replace('|','/')
        tb='\n'.join(f"| [[analytes/{f['analyte']}]] | {c(f['value'])} | {c(f['unit'])} | {c(f['basis'])} | {c(f['source_location'])} |" for f in fnd)
        body=f"""
# {title}

## Summary

{norm(r.get('what it measures','')).replace('|','/')}

## Key numbers

Values below are stated in the source text with one named analyte, one value and one unit in the same clause. They are shown as printed, without conversion. Table values were not transcribed, and this is not an exhaustive record of the paper.

"""+(('| analyte | value | unit | basis | source location |\n| --- | --- | --- | --- | --- |\n'+tb) if fnd else 'No values from this source are published. It is filed as context evidence.')+(f"\n\n{held} further candidate values were held because the clause named several values or analytes, or concerned limits, blood or intake rather than the product." if held else '')+f"""

## Evidence Fitness

{norm(r.get('relevance','')).replace('|','/')}

## Methods (brief)

See the methods section of the source PDF. Measured samples do not represent every product on the market.

## Limitations

Values are reported by the authors for their own samples. Censored results and detection limits are as defined in the source. No unit conversions were made.

## Provenance notes

DOI {doi} resolved at Crossref; {'DOI' if indoi else 'title'} matched in the filed PDF text. Original file: `{fn}`. SHA-256: `{sha}`. Library folder: papers-{folder}.

## Wiki pages updated on ingest

[[products/{prod}]]
"""+''.join(f'\n[[analytes/{a}]]\n' for a in fm['analytes'])
        open(f'wiki/sources/{slug}.md','w').write('---\n'+json.dumps(fm,indent=2,ensure_ascii=False).replace('\u2014','-')+'\n---'+body.replace('\u2014','-'))
        log.append([folder,prod,fn,'FILED',f'{len(fnd)} published, {held} held']); stats['filed']+=1; stats['published']+=len(fnd); stats['held']+=held
w=csv.writer(open('/workspace/fci-ingest2/log.csv','a')); w.writerows(log)
print(stats)
