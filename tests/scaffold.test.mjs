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
test("only explicitly requested, verified product slugs are present",()=>{
  const expected=JSON.parse(fs.readFileSync("docs/product-slugs.json"))
  const actual=fs.readdirSync("wiki/products").filter(f=>f!=="index.md").map(f=>f.replace(/\.md$/,""))
  assert.deepEqual(actual.sort(),expected.sort())
})
test("source metadata omits missing DOI and is idempotent", t => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"fci-metadata-"))
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}))
  fs.mkdirSync(path.join(dir,"wiki/sources"),{recursive:true})
  fs.mkdirSync(path.join(dir,"public/sources"),{recursive:true})
  // This bibliographic fixture uses the cited EPA document, without measurements.
  const source={type:"source",title:"Multi-Industry Per- and Polyfluoroalkyl Substances (PFAS) Study: 2021 Preliminary Report",authors:["U.S. Environmental Protection Agency"],year:2021,publication:"U.S. Environmental Protection Agency",access_url:"https://www.epa.gov/system/files/documents/2021-09/multi-industry-pfas-study_preliminary-2021-report_508_2021.09.08.pdf",no_doi_assigned:true,review_state:"approved_for_public"}
  fs.writeFileSync(path.join(dir,"wiki/sources/epa-method.md"),`---\n${Object.entries(source).map(([k,v])=>`${k}: ${JSON.stringify(v)}`).join("\n")}\n---\n`)
  const file=path.join(dir,"public/sources/epa-method.html")
  fs.writeFileSync(file,"<html><head></head><body></body></html>")
  assert.equal(run("postbuild-inject-jsonld",dir).status,0)
  const first=fs.readFileSync(file,"utf8")
  assert.match(first,/ScholarlyArticle/);assert.match(first,/citation_title/)
  assert.match(first,/citation_author/);assert.doesNotMatch(first,/citation_doi/)
  assert.equal(run("postbuild-inject-jsonld",dir).status,0)
  assert.equal(fs.readFileSync(file,"utf8"),first)
})
