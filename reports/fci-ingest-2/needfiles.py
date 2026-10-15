import json,glob,re,csv,os
out=[]
for f in sorted(glob.glob('manual/*.json')):
    s=os.path.basename(f)[:-5]; d=json.load(open(f))
    src=f'/workspace/fci/wiki/sources/{s}.md'; t=open(src).read() if os.path.exists(src) else ''
    m=re.search(r'"?doi"?:\s*"?([^"\n,]+)',t); doi=m.group(1).strip() if m else ''
    for h in d.get('held',[]):
        w=h if isinstance(h,str) else h.get('why','')+' ('+h.get('row','')+')'
        if re.search(r'\bS\d|SI\b|supplement|UNREADABLE|NO TABLES|rotated|not extract|figure',w,re.I):
            need='Supporting information file (tables)'
            if re.search('UNREADABLE|not extract|rotated',w,re.I): need='Readable copy of the cited table (image, CSV, or publisher HTML)'
            elif 'NO TABLES' in w: need='Supporting information with sample concentration tables, or author data'
            out.append([s,doi,'https://doi.org/'+doi if doi else '',need,w])
w=csv.writer(open('/workspace/fci/reports/fci-ingest-2/NEED-FILES.csv','w',newline=''))
w.writerow(['source_slug','doi','doi_url','file_needed','reason']); w.writerows(out); print(len(out), sum(1 for r in out if not r[1]), len({r[0] for r in out}))
