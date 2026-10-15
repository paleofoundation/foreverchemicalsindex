import json,glob,os,re,subprocess,sys
os.chdir('/workspace/fci')
def norm(s): return re.sub(r'\s+',' ',s.replace('−','-').replace('–','-').replace('\u2009',' ').replace('\u00a0',' '))
tot=[0,0];per={}
for mf in sorted(glob.glob('/workspace/fci-ingest2/manual/*.json')):
    slug=os.path.basename(mf)[:-5]; f=f'wiki/sources/{slug}.md'
    t=open(f).read(); fmraw,body=t.split('\n---',1); d=json.loads(fmraw[4:])
    M=json.load(open(mf)); pages={}
    def pg(n):
        if n not in pages: pages[n]=norm(subprocess.run(['pdftotext','-layout','-f',str(n),'-l',str(n),d['raw_path'],'-'],capture_output=True,text=True).stdout)
        return pages[n]
    fnd=[];held=list(M.get('held',[]))
    for r in M['rows']:
        label,an,stat,val,unit,matrix,page,loc=r[:8]; rprod=r[8] if len(r)>8 else M['product']
        P=pg(page); nums=re.findall(r'\d+(?:\.\d+)?',val)
        ok=label.split(' (')[0] in P and all(re.search(r'(?<![\d.])'+re.escape(x)+r'(?![\d])',P) for x in nums)
        row={'product':rprod,'analyte':an,'value':val,'unit':unit,'basis':f'{matrix}; {stat}','source_location':f'PDF p.{page}, {loc}','analyte_label':label,'statistic':stat,'matrix':matrix}
        (fnd if ok else held).append(row if ok else {'row':r,'why':'page check failed'})
    d['findings']=fnd; d['held_findings']=held; d['analytes']=sorted(set(x['analyte'] for x in fnd)); d['products']=sorted(set(d.get('products',[])+[x['product'] for x in fnd])); d['public_evidence_label']='Source-reported measurements' if fnd else 'Context source'
    d['extraction']='manual table reading'
    c=lambda x:str(x).replace('|','/')
    tb='| chemical | statistic | value | unit | matrix | source location |\n| --- | --- | --- | --- | --- | --- |\n'+'\n'.join(f"| [[analytes/{x['analyte']}]] ({c(x['analyte_label'])}) | {c(x['statistic'])} | {c(x['value'])} | {c(x['unit'])} | {c(x['matrix'])} | {c(x['source_location'])} |" for x in fnd)
    kn='## Key numbers\n\nValues read from the source tables and checked against the cited page. Shown as printed, without conversion. Selected records, not an exhaustive transcription.'+(f' {len(held)} values were held for review.' if held else '')+'\n\n'+(tb if fnd else 'No values published.')+'\n'
    body=re.sub(r'## Key numbers\n.*?(?=\n## )',lambda m:kn,body,count=1,flags=re.S)
    body=re.sub(r'(## Wiki pages updated on ingest\n).*',lambda m:m.group(1)+'\n'+'\n\n'.join([f'[[products/{p}]]' for p in d['products']]+[f'[[analytes/{a}]]' for a in d['analytes']])+'\n',body,flags=re.S)
    open(f,'w').write('---\n'+json.dumps(d,indent=2,ensure_ascii=False)+'\n---'+body.replace('\u2014','-'))
    tot[0]+=len(fnd);tot[1]+=len(held);per[slug]=(len(fnd),len(held))
for k,v in per.items(): print(k,v)
print('published',tot[0],'held',tot[1])
