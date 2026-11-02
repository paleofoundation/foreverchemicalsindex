import fs from "node:fs"
import { published, simplify } from "./lib/wiki.mjs"
const base="https://foreverchemicalsindex.com"
fs.writeFileSync("public/robots.txt",`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n# LLM guide: ${base}/llms.txt\n`)
const blurb = page => {
  const type = page.data.type
  if (type === "source") return "Bibliographic source record. Quotations on category pages are separate from the structured findings file."
  if (type === "section-index") return "Directory of the public pages in this section."
  if (["product-category", "product", "ingredient", "analyte", "analyte-class", "aggregate-measure"].includes(type)) {
    return page.data.status === "evidence"
      ? "Quotes values transcribed from cited studies in this repository. Empty cells are gaps."
      : "No source-reported measurement is published for this page. The gap is not a measured zero."
  }
  return "Reference scope and evidence policy."
}
fs.writeFileSync("public/llms.txt",`# Forever Chemicals Index

A free public index of PFAS measurements quoted from cited studies. Category and analyte pages show values as printed in those studies. The structured findings download includes only rows that pass the review gate. An empty cell or an empty download is a gap, not a measured zero, and not a product endorsement.

## Public pages

${published().map(page => `- [${page.data.title}](${base}/${simplify(page.slug)}): ${blurb(page)}`).join("\n")}

## Citation and corrections

Cite the specific canonical index page and the original work identified on its source page. The index is a reference organizer, not the author of the original studies. Use About for institutional context and Errata for the correction record; no direct contact address is supplied. References are body citations; Sources are reviewed routing associations. Neither implies that every source supports every statement. Revision history requires an actual reviewed correction record, not a build timestamp.

The Data and downloads page offers equivalent JSON and CSV findings and a public coverage JSON export. These describe eligible public records only, not the completeness of the private intake.

## Data policy

No inferred measurements, identifiers, citations, or regulatory limits. Empty data is a gap, not a measured zero. Quantitative claims must trace to a source page. Aggregate fluorine results are distinct from individual PFAS results. Source citation metadata reflects verified bibliographic fields only.

`)
console.log("robots.txt and llms.txt: PASS")
