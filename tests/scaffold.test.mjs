import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
const root=process.cwd()
function fixture(t) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"fci-test-"))
  fs.cpSync("wiki",path.join(dir,"wiki"),{recursive:true})
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}))
  return dir
}
function run(tool,dir) {return spawnSync(process.execPath,[path.join(root,"tools",`${tool}.mjs`)],{cwd:dir,encoding:"utf8"})}
for (const tool of ["audit-source-dois","audit-link-integrity","audit-product-source-routing","audit-synthesis-firewall"]) {
  test(`${tool} accepts the empty scaffold`,t=>{const r=run(tool,fixture(t));assert.equal(r.status,0,r.stdout+r.stderr)})
}
test("DOI audit blocks a source with missing provenance",t=>{
  const dir=fixture(t);fs.writeFileSync(path.join(dir,"wiki/sources/rejected.md"),"---\ntype: source\ndraft: false\n---\n")
  const r=run("audit-source-dois",dir);assert.equal(r.status,1);assert.match(r.stderr,/DOI or no_doi_assigned/)
})
test("link audit blocks a dangling destination",t=>{
  const dir=fixture(t);fs.appendFileSync(path.join(dir,"wiki/index.md"),"\n[[products/missing-destination]]\n")
  const r=run("audit-link-integrity",dir);assert.equal(r.status,1);assert.match(r.stderr,/missing destination/)
})
test("routing audit blocks an undeclared destination",t=>{
  const dir=fixture(t);fs.writeFileSync(path.join(dir,"wiki/sources/rejected.md"),"---\ntype: source\ndraft: true\nproducts: [missing-destination]\n---\n")
  const r=run("audit-product-source-routing",dir);assert.equal(r.status,1);assert.match(r.stderr,/unknown products/)
})
test("firewall blocks promotion even inside a generated block",t=>{
  const dir=fixture(t);fs.appendFileSync(path.join(dir,"wiki/index.md"),"\n<!-- BEGIN: generated -->\nApply for certification\n<!-- END: generated -->\n")
  const r=run("audit-synthesis-firewall",dir);assert.equal(r.status,1);assert.match(r.stderr,/promotional claim/)
})
test("empty generation is stable and emits no evidence rows",t=>{
  const dir=fixture(t);assert.equal(run("build-contamination-dataset",dir).status,0)
  const data=fs.readFileSync(path.join(dir,"wiki/data.md"),"utf8")
  assert.match(data,/<tbody><\/tbody>/)
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir,"wiki/static/contamination.json"))).records,[])
  assert.equal(fs.readFileSync(path.join(dir,"wiki/static/contamination.csv"),"utf8").trim().split("\n").length,1)
  assert.equal(run("build-contamination-dataset",dir).status,0)
  assert.equal(fs.readFileSync(path.join(dir,"wiki/data.md"),"utf8"),data)
})
test("original product slugs remain and added pages are filed scopes",()=>{
  const expected=JSON.parse(fs.readFileSync("docs/product-slugs.json"))
  const filed=["breast-milk","cereal-grains","childrens-products","cosmetics","drinking-water-tap","meat-and-poultry","produce-mixed","sunscreens","textiles"]
  const actual=fs.readdirSync("wiki/products").filter(f=>f!=="index.md").map(f=>f.replace(/\.md$/,""))
  assert.deepEqual(actual.sort(),[...expected,...filed].sort())
})
test("source metadata omits missing DOI and is idempotent", t => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"fci-metadata-"))
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}))
  fs.mkdirSync(path.join(dir,"wiki/sources"),{recursive:true})
  fs.mkdirSync(path.join(dir,"public/sources"),{recursive:true})
  // SYNTHETIC test review and provenance, never a claim of actual source approval.
  const source={type:"source",evidence_tier:"A",title:"TEST ONLY synthetic agency report",authors:["TEST ONLY Synthetic Agency"],source_type:"government-report",issuing_body:"TEST ONLY Synthetic Agency",year:2000,publication:"TEST ONLY report series",access_url:"https://example.invalid/test-only-report",no_doi_assigned:true,review_state:"approved_for_public",identity_verified:true,provenance_verified:true,sha256:"a".repeat(64),review_record:{id:"SYNTHETIC-TEST-ONLY",disposition:"approved_for_public",source_sha256:"a".repeat(64)}}
  fs.writeFileSync(path.join(dir,"wiki/sources/epa-method.md"),`---\n${Object.entries(source).map(([k,v])=>`${k}: ${JSON.stringify(v)}`).join("\n")}\n---\n`)
  const file=path.join(dir,"public/sources/epa-method.html")
  fs.writeFileSync(file,"<html><head></head><body></body></html>")
  assert.equal(run("postbuild-inject-jsonld",dir).status,0)
  const first=fs.readFileSync(file,"utf8")
  assert.match(first,/Report/);assert.doesNotMatch(first,/ScholarlyArticle|"@type":"Person"/);assert.match(first,/citation_title/)
  assert.match(first,/citation_author/);assert.doesNotMatch(first,/citation_doi/)
  assert.equal(run("postbuild-inject-jsonld",dir).status,0)
  assert.equal(fs.readFileSync(file,"utf8"),first)
})
