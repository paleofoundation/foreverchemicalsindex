import json,os
def W(slug,product,blocks,held=()):
    rows=[]
    for (matrix,page,table,unit,items) in blocks:
        for (label,an,stat,col,val) in items:
            rows.append([label,an,stat,val,unit,matrix,page,f'{table}, {label} row, {col} column'])
    json.dump({'product':product,'rows':rows,'held':[{'row':h,'why':'held on reading'} for h in held]},open(f'/workspace/fci-ingest2/manual/{slug}.json','w'),indent=1)
