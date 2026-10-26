import fs from "node:fs"
import assert from "node:assert/strict"
import { published, fail } from "./lib/wiki.mjs"
import { pageMetadata, publicEvidence, evidenceApparatus, apparatusHtml, pageUrl, base } from "./lib/metadata.mjs"
const errors = [], eligible = published()
const unescape = value => value.replaceAll("&quot;", '"').replaceAll("&lt;", "<").replaceAll("&amp;", "&")
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1].toLowerCase(), unescape(m[2])]))
const equal = (actual, expected, label) => { try { assert.deepEqual(actual, expected) } catch { errors.push(label) } }
for (const page of eligible) {
  const html = fs.readFileSync(`public/${page.slug}.html`, "utf8"), label = page.slug
  const canonicals = [...html.matchAll(/<link\b[^>]*>/gi)].map(m => attrs(m[0])).filter(a => a.rel === "canonical")
  equal(canonicals.map(a => a.href), [pageUrl(page)], `${label}: canonical must appear exactly once`)
  const og = [...html.matchAll(/<meta\b[^>]*>/gi)].map(m => attrs(m[0]))
  equal(og.filter(a => a.property === "og:url").map(a => a.content), [pageUrl(page)], `${label}: Open Graph URL mismatch`)
  const schemas = []
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (attrs(match[1]).type !== "application/ld+json") continue
    try { schemas.push({ attrs: attrs(match[1]), data: JSON.parse(match[2]) }) } catch { errors.push(`${label}: invalid JSON-LD`) }
  }
  equal(schemas.length, 2, `${label}: expected main graph and breadcrumbs only`)
  const record = evidenceApparatus(page, eligible)
  const blocks = [...html.matchAll(/<!-- BEGIN: public-evidence -->([\s\S]*?)<!-- END: public-evidence -->/g)]
  const original = html.replace(/<!-- BEGIN: public-evidence -->[\s\S]*?<!-- END: public-evidence -->/g, "")
  const expectedApparatus = apparatusHtml({ ...record, references: /id="references"/.test(original) ? [] : record.references, routedSources: /id="sources"/.test(original) ? [] : record.routedSources })
  equal(blocks.map(m => m[1]), expectedApparatus ? [expectedApparatus] : [], `${label}: generated References/Sources differ from eligible apparatus`)
  for (const id of ["references", "sources"]) if ([...html.matchAll(new RegExp(`id="${id}"`, "g"))].length > 1) errors.push(`${label}: duplicate ${id} heading`)
  const { graph, fields } = pageMetadata(page)
  equal(schemas.filter(s => s.attrs["data-fci-schema"] === "main").map(s => s.data), [{ "@context": "https://schema.org", "@graph": graph }], `${label}: main graph differs from eligible metadata`)
  const crumbs = schemas.filter(s => s.data["@type"] === "BreadcrumbList")
  if (crumbs.length !== 1 || crumbs[0].data.itemListElement?.at(-1)?.item?.replace(/\/$/, "") !== pageUrl(page).replace(/\/$/, "")) errors.push(`${label}: invalid breadcrumb destination`)
  equal(og.filter(a => a.name?.startsWith("citation_")).map(a => [a.name, a.content]), fields.map(([name, value]) => [name, String(value)]), `${label}: citation metadata mismatch`)
}
const notFound = fs.readFileSync("public/404.html", "utf8")
if (/<link[^>]+rel="canonical"|property="og:url"|application\/ld\+json|name="citation_/i.test(notFound) || !/name="robots" content="noindex"/.test(notFound)) errors.push("404 metadata must be noindex without canonical, OG URL, or evidence schemas")
const coverage = JSON.parse(fs.readFileSync("public/static/public-evidence.json", "utf8"))
equal(coverage, publicEvidence(eligible), "Public evidence export differs from eligible apparatus")
const robots = fs.readFileSync("public/robots.txt", "utf8")
if (!robots.includes(`# LLM guide: ${base}/llms.txt`)) errors.push("Missing robots LLM guide pointer")
for (const ext of ["json", "csv"]) if (!fs.existsSync(`public/static/contamination.${ext}`)) errors.push(`Missing advertised ${ext} distribution`)
fail(errors, `audit-metadata (${eligible.length} pages; all JSON-LD and citation tags)`)
