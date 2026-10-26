import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { sourceMetadata, pageMetadata, evidenceApparatus, apparatusHtml } from "../tools/lib/metadata.mjs"
const root = process.cwd()
const fixturePage = (slug, data = {}, content = "") => ({ slug, data: { title: "TEST ONLY fixture", ...data }, content })
const agency = "TEST ONLY Synthetic Agency"
const source = fixturePage("sources/test-only", { type: "source", title: "TEST ONLY synthetic report", authors: [agency], year: 2000, publication: "TEST ONLY report series", access_url: "https://example.invalid/test-only", source_type: "government-report", issuing_body: agency })
test("government report issuer is Organization and report is not a journal", () => {
  const { work, fields } = sourceMetadata(source)
  assert.equal(work["@type"], "Report"); assert.deepEqual(work.author, [{ "@type": "Organization", name: agency }])
  assert.equal(work.isPartOf, undefined); assert(!fields.some(([key]) => /journal|doi|fulltext|pdf/.test(key)))
})
test("explicit scholarly and dataset types retain their different semantics", () => {
  const article = sourceMetadata({ ...source, data: { ...source.data, source_type: "journal-article", doi: "10.1234/TEST-ONLY", author_entities: [{ name: agency, type: "Organization" }] } })
  assert.equal(article.work["@type"], "ScholarlyArticle"); assert.equal(article.work.isPartOf["@type"], "Periodical")
  assert(article.fields.some(([key, value]) => key === "citation_doi" && value === "10.1234/TEST-ONLY"))
  assert.equal(sourceMetadata({ ...source, data: { ...source.data, source_type: "dataset" } }).work["@type"], "Dataset")
})
test("unknown source class and author entity types are omitted without guessing", () => {
  const { work } = sourceMetadata({ ...source, data: { ...source.data, source_type: "primary_measurement", issuing_body: undefined, author_entities: [{ name: "UNMATCHED TEST ONLY", type: "Person" }, { name: agency, type: "Unknown" }] } })
  assert.equal(work["@type"], "CreativeWork"); assert.equal(work.author, undefined)
  for (const key of ["identifier", "license", "affiliation", "dateModified", "isPartOf"]) assert.equal(work[key], undefined)
})
test("explicit matched people are allowed but never override an issuing organization", () => {
  const data = { ...source.data, authors: [agency, "TEST ONLY Person"], author_entities: [null, { name: agency, type: "Person" }, { name: agency, type: "Person" }, { name: "TEST ONLY Person", type: "Person" }] }
  assert.deepEqual(sourceMetadata({ ...source, data }).work.author, [{ "@type": "Organization", name: agency }, { "@type": "Person", name: "TEST ONLY Person" }])
})
test("page graph separates CollectionPage, WebPage, source work and empty export", () => {
  assert.equal(pageMetadata(fixturePage("products/index", { type: "section-index" })).graph.at(-1)["@type"], "CollectionPage")
  assert.equal(pageMetadata(fixturePage("products/index", { type: "section-index" })).graph.at(-1).url, "https://foreverchemicalsindex.com/products/")
  const { graph } = pageMetadata(fixturePage("data", { type: "reference" }))
  assert.equal(graph.at(-1)["@type"], "WebPage")
  const dataset = graph.find(n => n["@type"] === "Dataset")
  assert.equal(dataset.distribution.length, 2); assert.equal(dataset.license, undefined); assert.equal(dataset.dateModified, undefined)
})
test("References are ordered body citations and Sources are separate routing associations", () => {
  const routed = { ...source, data: { ...source.data, products: ["test-only-profile"], findings: [{ product: "test-only-profile", analyte: "test-only-analyte", value: "TEST ONLY" }] } }
  const other = { ...source, slug: "sources/test-only-other" }
  const page = fixturePage("products/test-only-profile", { revisions: [{ date: "2000-01-01", description: "UNVALIDATED TEST ONLY" }] }, "[[sources/test-only-other|1]] [[sources/test-only-other]] [2](/sources/test-only-other) [[sources/held-test-only]] `[[sources/test-only]]` <!-- [[sources/test-only]] -->")
  const result = evidenceApparatus(page, [page, routed, other])
  assert.deepEqual(result.references.map(s => s.slug), [other.slug]); assert.deepEqual(result.routedSources.map(s => s.slug), [source.slug])
  assert.deepEqual(result.coverage, { citedSources: 1, routedSources: 1, publishedFindings: 1 }); assert.deepEqual(result.revisions, [])
  const html = apparatusHtml(result); assert.match(html, /id="references"/); assert.match(html, /id="sources"/); assert.doesNotMatch(html, /held-test-only|UNVALIDATED/)
})
test("empty apparatus invents no headings, history, or findings", () => {
  const result = evidenceApparatus(fixturePage("about"), [source])
  assert.equal(apparatusHtml(result), ""); assert.equal(result.coverage.publishedFindings, 0); assert.deepEqual(result.revisions, [])
})
function tempFixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fci-c-test-only-")); t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  fs.mkdirSync(path.join(dir, "wiki/sources"), { recursive: true }); fs.mkdirSync(path.join(dir, "public/sources"), { recursive: true }); fs.mkdirSync(path.join(dir, "public/static"), { recursive: true })
  const data = { ...source.data, evidence_tier: "A", no_doi_assigned: true, review_state: "approved_for_public", identity_verified: true, provenance_verified: true, sha256: "a".repeat(64), review_record: { id: "TEST-ONLY-SYNTHETIC", disposition: "approved_for_public", source_sha256: "a".repeat(64) } }
  const write = (slug, frontmatter) => fs.writeFileSync(path.join(dir, `wiki/${slug}.md`), `---\n${Object.entries(frontmatter).map(([k,v])=>`${k}: ${JSON.stringify(v)}`).join("\n")}\n---\nTEST ONLY fixture\n`)
  write(source.slug, data)
  for (const [key, value] of [["draft", true], ["confidence", "HOLD"], ["evidence_tier", "pending"], ["review_state", "unreviewed"]]) write(`sources/held-test-only-${key}`, { ...data, [key]: value, held_findings: [{ value: "HELD-SECRET-TEST-ONLY" }] })
  fs.writeFileSync(path.join(dir, `public/${source.slug}.html`), '<html><head><link rel="canonical" href="https://foreverchemicalsindex.com/sources/test-only"><meta property="og:url" content="https://foreverchemicalsindex.com/sources/test-only"><meta name="citation_doi" content="STALE-TEST-ONLY"></head><body><article><h1>TEST ONLY</h1></article></body></html>')
  fs.writeFileSync(path.join(dir, "public/404.html"), '<head><meta name="robots" content="noindex"></head>')
  fs.writeFileSync(path.join(dir, "public/static/contamination.json"), '{"records":[]}'); fs.writeFileSync(path.join(dir, "public/static/contamination.csv"), 'product,analyte,value,unit,basis,source_location,source\n')
  return dir
}
function run(tool, dir) { const r = spawnSync(process.execPath, [path.join(root, "tools", `${tool}.mjs`)], { cwd: dir, encoding: "utf8" }); return r }
function generate(dir) { for (const tool of ["postbuild-inject-jsonld", "postbuild-inject-breadcrumbs", "postbuild-evidence-apparatus", "postbuild-llms-txt"]) { const r = run(tool, dir); assert.equal(r.status, 0, r.stdout+r.stderr) } }
test("postbuilds are idempotent and omit four independent held source states", t => {
  const dir = tempFixture(t); generate(dir)
  const files = [`sources/test-only.html`, "static/public-evidence.json", "llms.txt", "robots.txt"]
  const first = files.map(f => fs.readFileSync(path.join(dir, "public", f), "utf8"))
  generate(dir); assert.deepEqual(files.map(f => fs.readFileSync(path.join(dir, "public", f), "utf8")), first)
  assert.doesNotMatch(first.join(""), /HELD-SECRET|held-test-only|STALE-TEST-ONLY|citation_doi|"@type":"Person"/)
  const result = run("audit-metadata", dir); assert.equal(result.status, 0, result.stdout+result.stderr)
})
for (const [name, mutate] of [
  ["duplicate canonical", dir => fs.appendFileSync(path.join(dir,"public/sources/test-only.html"), '<link rel="canonical" href="https://foreverchemicalsindex.com/sources/test-only">')],
  ["false person schema", dir => { const f=path.join(dir,"public/sources/test-only.html");fs.writeFileSync(f,fs.readFileSync(f,"utf8").replace('"@type":"Organization","name":"TEST ONLY Synthetic Agency"','"@type":"Person","name":"TEST ONLY Synthetic Agency"')) }],
  ["404 canonical", dir => fs.appendFileSync(path.join(dir,"public/404.html"), '<link rel="canonical" href="https://foreverchemicalsindex.com/">')],
  ["private apparatus link", dir => fs.appendFileSync(path.join(dir,"public/sources/test-only.html"), '<!-- BEGIN: public-evidence --><a href="https://foreverchemicalsindex.com/sources/held-test-only">LEAK TEST ONLY</a><!-- END: public-evidence -->')],
  ["private coverage leak", dir => { const f=path.join(dir,"public/static/public-evidence.json"), data=JSON.parse(fs.readFileSync(f));data.pages.push({slug:"sources/held-test-only"});fs.writeFileSync(f,JSON.stringify(data)) }],
]) test(`metadata audit rejects ${name}`, t => { const dir=tempFixture(t);generate(dir);mutate(dir);const r=run("audit-metadata",dir);assert.equal(r.status,1,r.stdout+r.stderr) })

test("Markdown citation parser excludes code examples and resolves actual relative/reference links", () => {
  const other = { ...source, slug: "sources/test-only-other" }
  const page = fixturePage("products/test-only-profile", {}, "~~~md\n[[sources/test-only]]\n~~~\n\n`[[sources/test-only]]`\n\n<!-- [[sources/test-only]] -->\n\n[actual](../sources/test-only-other.md#scope) and [same][r]\n\n[r]: /sources/test-only-other\n[unused]: /sources/test-only\n")
  assert.deepEqual(evidenceApparatus(page, [page, source, other]).references.map(p => p.slug), [other.slug])
})
test("nonempty generated References are escaped, unique and stable without a profile-gate exception", t => {
  const dir = tempFixture(t), file = path.join(dir, "wiki/sources/test-only.md"), built = path.join(dir, "public/sources/test-only.html")
  fs.appendFileSync(file, "\n[[sources/test-only|TEST ONLY citation]]\n")
  generate(dir)
  const first = fs.readFileSync(built, "utf8")
  assert.equal((first.match(/id="references"/g) ?? []).length, 1)
  assert.doesNotMatch(apparatusHtml({references:[{url:"https://example.invalid",title:"<script>TEST ONLY</script>"}],routedSources:[]}), /<script>/)
  assert.match(first, /Sources explicitly cited/); assert.doesNotMatch(first, /id="sources"/)
  generate(dir); assert.equal(fs.readFileSync(built, "utf8"), first)
  fs.writeFileSync(built, first.replace(/<!-- BEGIN: public-evidence -->[\s\S]*?<!-- END: public-evidence -->/, '<h2 id="references">TEST ONLY existing references</h2>'))
  assert.equal(run("postbuild-evidence-apparatus", dir).status, 0)
  assert.equal((fs.readFileSync(built,"utf8").match(/id="references"/g) ?? []).length, 1)
})
