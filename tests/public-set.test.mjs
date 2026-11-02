import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { published, simplify } from "../tools/lib/wiki.mjs"
const tool = path.resolve("tools/audit-public-set.mjs")
function fixture(t) {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),"fci-public-set-"));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));fs.cpSync("wiki",path.join(dir,"wiki"),{recursive:true});fs.mkdirSync(path.join(dir,"public/static"),{recursive:true})
 const eligible=published();for(const p of eligible){const f=path.join(dir,"public",p.slug+".html");fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,"SYNTHETIC rendered navigation fixture")}
 fs.writeFileSync(path.join(dir,"public/404.html"),"SYNTHETIC 404 fixture")
 for(const file of ["contentIndex","askIndex"]) fs.writeFileSync(path.join(dir,`public/static/${file}.json`),JSON.stringify(Object.fromEntries(eligible.map(p=>[p.slug,{}]))))
 fs.writeFileSync(path.join(dir,"public/sitemap.xml"),`<urlset>${eligible.map(p=>`<url><loc>https://foreverchemicalsindex.com/${simplify(p.slug)}</loc></url>`).join("")}</urlset>`)
 const scholarly=eligible.filter(p=>p.data.type==="source")
 fs.writeFileSync(path.join(dir,"public/sitemap-scholarly.xml"),`<urlset>${scholarly.map(p=>`<url><loc>https://foreverchemicalsindex.com/${simplify(p.slug)}</loc></url>`).join("")}</urlset>`)
 fs.writeFileSync(path.join(dir,"public/llms.txt"),eligible.map(p=>`[${p.data.title}](https://foreverchemicalsindex.com/${simplify(p.slug)})`).join("\n"))
 fs.writeFileSync(path.join(dir,"public/static/contamination.json"),'{"records":[]}');fs.writeFileSync(path.join(dir,"public/static/contamination.csv"),"product,analyte,value,unit,basis,source_location,source\n");return dir
}
const run = dir=>spawnSync(process.execPath,[tool],{cwd:dir,encoding:"utf8"})
test("eligible navigation has identical public discovery sets and no findings",t=>{const r=run(fixture(t));assert.equal(r.status,0,r.stdout+r.stderr)})
for(const surface of ["HTML","search","answer excerpts","CSV","guide"])test(`stale private ${surface} blocks publication`,t=>{
 const dir=fixture(t),p=path.join(dir,"public")
 if(surface==="HTML"){fs.mkdirSync(path.join(p,"private"),{recursive:true});fs.writeFileSync(path.join(p,"private/not-public.html"),"PRIVATE SENTINEL")}
 if(surface==="search"||surface==="answer excerpts"){const f=path.join(p,`static/${surface==="search"?"contentIndex":"askIndex"}.json`),j=JSON.parse(fs.readFileSync(f));j["drafts/private-source"]={content:"PRIVATE SENTINEL"};fs.writeFileSync(f,JSON.stringify(j))}
 if(surface==="CSV")fs.appendFileSync(path.join(p,"static/contamination.csv"),"PRIVATE,SENTINEL,not-a-real-result\n")
 if(surface==="guide")fs.appendFileSync(path.join(p,"llms.txt"),"\n[Private](https://foreverchemicalsindex.com/private/not-public)")
 const r=run(dir);assert.equal(r.status,1,r.stdout+r.stderr)
})
