import json,yaml,re,os,collections
os.chdir('/workspace/fci')
R=json.load(open('/workspace/fci-promote/verify.json'))
AN=set(f[:-3] for f in os.listdir('wiki/analytes'))-{'index'}
LABEL={a:yaml.safe_load(open(f'wiki/analytes/{a}.md').read().split('---')[1])['title'] for a in AN}
def cell(x): return str(x).replace('|','/').replace('\n',' ').replace('\u2014','-')
DROP=re.compile(r'remains HOLD|Confidence:? HOLD|not been approved|not approved for|Values are not approved|All evidence remains|selected transcription remains HOLD',re.I)
stats=collections.Counter(); byprod=collections.defaultdict(list); byan=collections.defaultdict(list); srcprod=collections.defaultdict(set); srcan=collections.defaultdict(set)
promoted=[];held_rows=[]
for s in R:
    f=s['file']; t=open(f).read(); fm,body=t.split('\n---',1); d=yaml.safe_load(fm[4:]); slug=os.path.basename(f)[:-3]
    if s['issues']:
        stats['sources_held']+=1; stats['findings_held']+=len(s['ok'])+len(s['held'])
        for x in s['ok']+s['held']: held_rows.append((slug,x['h'].get('analyte'),x['h'].get('value'),'; '.join(s['issues'])))
        continue
    fnd=[]
    for x in s['ok']:
        h=x['h']; row={'product':h['product'],'analyte':x['slug'],'value':str(h['value']),'unit':str(h['unit']),'basis':str(h['basis']),'source_location':str(h['source_location'])}
        lim=h.get('qualifier') or h.get('detection_limit') or h.get('detection_limits')
        if lim: row['limits']=cell(lim if isinstance(lim,str) else json.dumps(lim,ensure_ascii=False))
        fnd.append(row)
    for x in s['held']: held_rows.append((slug,x['h'].get('analyte'),x['h'].get('value'),'; '.join(x['why'])))
    stats['findings_promoted']+=len(fnd); stats['findings_held']+=len(s['held']); stats['sources_promoted']+=1
    d['draft']=False; d['evidence_tier']='reviewed'; d['review_state']='approved_for_public'; d['confidence']='reviewed'
    d['public_evidence_label']='Source-reported measurements' if fnd else 'Context source'
    if str(d.get('evidence_fitness','')).find('HOLD')>=0: d['evidence_fitness']='Direct matrix evidence; selected source-reported values'
    d['findings']=fnd; d['held_findings']=[x['h'] for x in s['held']]
    d['analytes']=sorted(set([a for a in d.get('analytes',[]) if a in AN]+[r['analyte'] for r in fnd]))
    d['products']=sorted(set(d.get('products',[])+[r['product'] for r in fnd]))
    # body
    parts=re.split(r'\n(?=## )',body.strip('\n'))
    out=[]
    for p in parts:
        head=p.split('\n',1)[0]
        if head.startswith('## Key numbers'):
            tb=['## Key numbers','',f'Source-reported values checked against the cited page of the filed PDF. Values are reported as printed, without conversion. These are selected records, not an exhaustive transcription.','']
            if fnd:
                tb+=['| analyte | value | unit | basis | source location | limits and qualifiers |','| --- | --- | --- | --- | --- | --- |']
                tb+=[f"| [[analytes/{r["analyte"]}]] | {cell(r['value'])} | {cell(r['unit'])} | {cell(r['basis'])} | {cell(r['source_location'])} | {r.get('limits','')} |" for r in fnd]
            else: tb+=['No values from this source are published. It is filed as method or context evidence.']
            if s['held']: tb+=['',f'{len(s["held"])} further transcribed values remain under review and are not shown.']
            out.append('\n'.join(tb)); continue
        if head.startswith('## Wiki pages updated'):
            links=[f'[[products/{p}]]' for p in d['products']]+[f'[[analytes/{a}]]' for a in d['analytes']]
            out.append('## Wiki pages updated on ingest\n\n'+'\n\n'.join(links)); continue
        lines=[l for l in p.split('\n') if not DROP.search(l)]
        out.append('\n'.join(lines))
    newbody='\n\n'+'\n\n'.join(out).replace('\u2014','-')+'\n'
    open(f,'w').write('---\n'+json.dumps(d,indent=2,ensure_ascii=False,default=str)+'\n---'+newbody)
    promoted.append(slug)
    for r in fnd: byprod[r['product']].append((slug,r)); byan[r['analyte']].append((slug,r))
    for p in d['products']: srcprod[p].add(slug)
    for a in d['analytes']: srcan[a].add(slug)
# product and analyte pages
def table(rows,key):
    h='| '+('analyte' if key=='analyte' else 'product')+' | value | unit | basis | source location | source |\n| --- | --- | --- | --- | --- | --- |\n'
    return h+'\n'.join(f"| [[{'analytes' if key=='analyte' else 'products'}/{r[key]}]] | {cell(r['value'])} | {cell(r['unit'])} | {cell(r['basis'])} | {cell(r['source_location'])} | [[sources/{s}]] |" for s,r in rows)
def update(path,rows,key,srcs):
    t=open(path).read(); fm,body=t.split('\n---',1); d=yaml.safe_load(fm[4:])
    d['sources']=sorted(srcs); d['evidence_tier']='reviewed' if rows else d.get('evidence_tier'); 
    if rows or srcs: d['status']='evidence'
    if key=='analyte': d['analytes']=sorted(set(r['analyte'] for _,r in rows))
    body=re.sub(r'Evidence review pending\.[^\n]*', f'{len(rows)} source-reported values from {len(set(s for s,_ in rows))} filed studies. Values are shown as printed in each source, with the basis and page. Studies differ in samples, methods and limits, so values are not directly comparable. Measured samples do not represent every product on the market.' if rows else 'Filed sources are listed below. No values are published for this page yet.',body,count=1)
    occ=table(rows,key)+'\n' if rows else 'No published values yet.\n'
    body=re.sub(r'(## Occurrence evidence\n)(.*?)(?=\n## )', lambda m: m.group(1)+'\n'+occ, body, count=1, flags=re.S)
    sl='\n'.join(f'- [[sources/{x}]]' for x in sorted(srcs))+'\n'
    body=re.sub(r'(## Sources\n)(.*?)(?=\n## |\n\[\[)', lambda m: m.group(1)+'\n'+sl, body, count=1, flags=re.S)
    out='---\n'+yaml.safe_dump(d,sort_keys=False,allow_unicode=True)+'---'+body
    open(path,'w').write(out.replace('\u2014','-'))
for p,srcs in srcprod.items():
    path=f'wiki/products/{p}.md'
    if os.path.exists(path): update(path,byprod[p],'analyte',srcs)
    else: print('missing product page',p)
for a,srcs in srcan.items(): update(f'wiki/analytes/{a}.md',byan[a],'product',srcs)
json.dump({'stats':stats,'promoted':promoted,'byprod':{k:len(v) for k,v in byprod.items()}},open('/workspace/fci-promote/summary.json','w'),indent=1)
import csv
w=csv.writer(open('/workspace/fci-promote/HELD.csv','w')); w.writerow(['source','analyte','value','reason']); w.writerows(held_rows)
print(stats, {k:len(v) for k,v in byprod.items()})
