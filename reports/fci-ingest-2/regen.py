import json,os,re,yaml,glob,collections
os.chdir('/workspace/fci')
import sys; sys.path.insert(0,'/workspace/fci-ingest2')
TITLES={'breast-milk':'Breast milk','textiles':'Textiles, apparel and outdoor gear','produce-mixed':'Fruit and vegetables','meat-and-poultry':'Meat and poultry','cereal-grains':'Cereal grains','childrens-products':"Children's products",'cosmetics':'Cosmetics','sunscreens':'Sunscreens'}
def load(f):
    t=open(f).read(); fm,body=t.split('\n---',1); return yaml.safe_load(fm[4:]),body
slugs=json.load(open('docs/product-slugs.json'))
for s,ti in TITLES.items():
    p=f'wiki/products/{s}.md'
    if not os.path.exists(p):
        open(p,'w').write(f'---\ntitle: "{ti}"\ntype: product-category\nstatus: scaffold\nevidence_tier: pending\nanalytes: []\nsources: []\n---\n\n# {ti}\n\nEvidence review pending. This category page contains no measurements or findings.\n\n## Occurrence evidence\n\n## Analytical methods\n\n## Regulatory references\n\n## Evidence gaps\n\n## Sources\n\n## Navigation\n\n[[products/index|Products]] · [[analytes/index|Analytes]] · [[methodology|Methodology]]\n')
    if s not in slugs: slugs.append(s)
json.dump(slugs,open('docs/product-slugs.json','w'),indent=2); open('docs/product-slugs.json','a').write('\n')
bp=collections.defaultdict(list);ba=collections.defaultdict(list);sp=collections.defaultdict(set);sa=collections.defaultdict(set)
for f in sorted(glob.glob('wiki/sources/*.md')):
    if f.endswith(('_TEMPLATE.md','index.md')): continue
    d,_=load(f)
    if d.get('draft') in (True,'true') or d.get('evidence_tier')=='pending': continue
    s=os.path.basename(f)[:-3]
    for r in d.get('findings') or []: bp[r['product']].append((s,r)); ba[r['analyte']].append((s,r))
    for p in d.get('products',[]): sp[p].add(s)
    for a in d.get('analytes',[]): sa[a].add(s)
def cell(x): return str(x).replace('|','/').replace('\n',' ')
def table(rows,key):
    h='| '+('analyte' if key=='analyte' else 'product')+' | value | unit | basis | source location | source |\n| --- | --- | --- | --- | --- | --- |\n'
    return h+'\n'.join(f"| [[{'analytes' if key=='analyte' else 'products'}/{r[key]}]] | {cell(r['value'])} | {cell(r['unit'])} | {cell(r['basis'])} | {cell(r['source_location'])} | [[sources/{s}]] |" for s,r in rows)
INTRO=re.compile(r'^(Evidence review pending\.[^\n]*|\d+ source-reported values from[^\n]*|Filed sources are listed below\.[^\n]*)$',re.M)
def update(path,rows,key,srcs):
    d,body=load(path)
    d['sources']=sorted(srcs)
    if rows: d['evidence_tier']='reviewed'
    if rows or srcs: d['status']='evidence'
    if key=='analyte': d['analytes']=sorted(set(r['analyte'] for _,r in rows))
    intro=f'{len(rows)} source-reported values from {len(set(s for s,_ in rows))} filed studies. Values are shown as printed in each source, with the basis and page. Studies differ in samples, methods and limits, so values are not directly comparable. Measured samples do not represent every product on the market.' if rows else 'Filed sources are listed below. No values are published for this page yet.'
    body=INTRO.sub(lambda m: intro,body,count=1)
    occ=table(rows,key)+'\n' if rows else 'No published values yet.\n'
    body=re.sub(r'(## Occurrence evidence\n)(.*?)(?=\n## )', lambda m: m.group(1)+'\n'+occ, body, count=1, flags=re.S)
    sl='\n'.join(f'- [[sources/{x}]]' for x in sorted(srcs))+'\n'
    body=re.sub(r'(## Sources\n)(.*?)(?=\n## |\n\[\[)', lambda m: m.group(1)+'\n'+sl, body, count=1, flags=re.S)
    open(path,'w').write(('---\n'+yaml.safe_dump(d,sort_keys=False,allow_unicode=True)+'---'+body).replace('\u2014','-'))
for p in set(sp): update(f'wiki/products/{p}.md',bp[p],'analyte',sp[p])
for a in set(sa): update(f'wiki/analytes/{a}.md',ba[a],'product',sa[a])
print({p:len(v) for p,v in sorted(bp.items())})
