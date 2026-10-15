import glob,yaml,os,re,json,hashlib,subprocess,csv,urllib.request,difflib,sys
os.chdir('/workspace/fci')
AN=set(os.path.basename(f)[:-3] for f in glob.glob('wiki/analytes/*.md'))-{'index'}
amap={'6:2 FTOH':'6-2-ftoh'}
BAD=re.compile(r'conflict|mismatch|malformed|quarantin|discrepan|unresolved|reconcil|typo|unclear|ambigu|inconsisten|not verified|unverif|illegible|garbled',re.I)
SOFT=re.compile(r'unstaged|Table S\d|supplement',re.I)
mm=[]
for f in glob.glob('reports/**/MISMATCHES.csv',recursive=True):
    for r in csv.DictReader(open(f)): mm.append(' '.join(v or '' for v in r.values()))
def pages(pdf):
    out='/workspace/fci-promote/txt/'+hashlib.md5(pdf.encode()).hexdigest()+'.txt'
    if not os.path.exists(out): subprocess.run(['pdftotext','-layout',pdf,out])
    return open(out,errors='ignore').read().split('\f')
def norm(s): return re.sub(r'\s+',' ',s.replace('−','-').replace('–','-').replace('\u2009',' ').replace(',', '.'))
def nums(v): return re.findall(r'\d+(?:[.,]\d+)?',str(v))
cr={}
def crossref(doi):
    if doi in cr: return cr[doi]
    try:
        j=json.load(urllib.request.urlopen(urllib.request.Request('https://api.crossref.org/works/'+doi,headers={'User-Agent':'fci-verify (mailto:info@paleofoundation.com)'}),timeout=30))
        cr[doi]=(j['message'].get('title') or [''])[0]
    except Exception as e: cr[doi]=None
    return cr[doi]
res=[]
for f in sorted(glob.glob('wiki/sources/*.md')):
    if f.endswith(('_TEMPLATE.md','index.md')): continue
    t=open(f).read(); fm=t.split('\n---',1)[0][4:]; d=yaml.safe_load(fm)
    src={'file':f,'key':d.get('cite_key'),'issues':[],'ok':[],'held':[]}
    rp=d.get('raw_path') or ''
    if not os.path.exists(rp): src['issues'].append('no raw file')
    elif d.get('sha256') and hashlib.sha256(open(rp,'rb').read()).hexdigest()!=d['sha256']: src['issues'].append('sha mismatch')
    doi=d.get('doi')
    if not doi or not re.match(r'^10\.\d{4,9}/\S+$',str(doi)): src['issues'].append('no valid doi')
    else:
        ct=crossref(doi)
        if ct is None: src['issues'].append('doi not resolvable at crossref')
        else:
            r=difflib.SequenceMatcher(None,re.sub(r'\W','',ct.lower()),re.sub(r'\W','',str(d.get('title','')).lower())).ratio()
            if r<0.80: src['issues'].append(f'crossref title mismatch {r:.2f}: {ct}')
    for k in ('title','publication','year','authors','access_url'):
        if not d.get(k): src['issues'].append('missing '+k)
    P=pages(rp) if os.path.exists(rp) and rp.endswith('.pdf') else None
    if P is None and not src['issues']: src['issues'].append('raw not pdf')
    sur=re.split(r'[-_]',str(d.get('cite_key','')).replace('fci-',''))
    sur=[s for s in sur if s.isalpha() and len(s)>2][:1]
    for h in d.get('held_findings') or []:
        why=[]
        a=h.get('analyte'); a=amap.get(a,str(a).lower() if a else a)
        if a not in AN: why.append(f'analyte {h.get("analyte")} has no page')
        txt=' '.join(str(v) for v in h.values())
        if BAD.search(txt): why.append('flag: '+BAD.search(txt).group(0))
        st=' '.join(str(h.get(k,'')) for k in ('value','basis','source_location'))
        if SOFT.search(st): why.append('cites unstaged/supplement: '+SOFT.search(st).group(0))
        ns=nums(h.get('value'))
        if P is not None:
            pg=[int(x) for x in re.findall(r'p\.?\s*(\d+)',str(h.get('source_location')))]
            scope=' '.join(' '.join(P[max(p-2,0):p+1]) for p in pg) if pg and max(pg)<=len(P) else ' '.join(P)
            sc=norm(scope)
            for x in ns:
                if not re.search(r'(?<![\d.])'+re.escape(x.replace(',','.'))+r'(?![\d])',sc): why.append(f'value {x} not on cited page'); break
            if not ns and str(h.get('value')).strip().lower() not in sc.lower(): why.append('marker not on page')
        for m in mm:
            if sur and sur[0].lower() in m.lower() and ns and any(re.search(r'(?<![\d.])'+re.escape(x)+r'(?![\d])',m) for x in ns):
                why.append('in MISMATCHES'); break
        (src['held'] if why else src['ok']).append({'h':h,'slug':a,'why':why})
    res.append(src)
json.dump(res,open('/workspace/fci-promote/verify.json','w'),indent=1,default=str)
ok=sum(len(s['ok']) for s in res if not s['issues']); hold=sum(len(s['ok'])+len(s['held']) for s in res)-ok
print('sources',len(res),'clean sources',sum(1 for s in res if not s['issues']),'sources clean w/ ok findings',sum(1 for s in res if not s['issues'] and s['ok']))
print('promotable findings',ok,'held',hold)
for s in res:
    if s['issues']: print('SRC',s['key'],s['issues'])
