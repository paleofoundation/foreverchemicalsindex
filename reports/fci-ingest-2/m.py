import json,os
def W(slug,product,blocks,held=()):
    rows=[]
    for blk in blocks:
        matrix,page,table,unit,items=blk[:5]; prod=blk[5] if len(blk)>5 else None
        for (label,an,stat,col,val) in items:
            rows.append([label,an,stat,val,unit,matrix,page,f'{table}, {label} row, {col} column']+([prod] if prod else []))
    json.dump({'product':product,'rows':rows,'held':[{'row':h,'why':'held on reading'} for h in held]},open(f'/workspace/fci-ingest2/manual/{slug}.json','w'),indent=1)
