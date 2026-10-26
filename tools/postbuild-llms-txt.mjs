import fs from "node:fs"
import { published, simplify } from "./lib/wiki.mjs"
const base="https://foreverchemicalsindex.com"
fs.writeFileSync("public/robots.txt",`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n# LLM guide: ${base}/llms.txt\n`)
fs.writeFileSync("public/llms.txt",`# Forever Chemicals Index

A source-traceable PFAS reference under preparation. No reviewed occurrence findings are published. Planned profiles remain private until discovery and review gates are met.

## Public pages

${published().map(page => `- [${page.data.title}](${base}/${simplify(page.slug)}): ${page.data.type === "section-index" ? "Public section directory; planned profiles remain private." : "Reference scope and evidence policy."}`).join("\n")}

## Citation and corrections

Cite the specific canonical index page and the original work identified on its source page. The index is a reference organizer, not the author of the original studies. Use About for institutional context and Errata for the correction record; no direct contact address is supplied. References are body citations; Sources are reviewed routing associations. Neither implies that every source supports every statement. Revision history requires an actual reviewed correction record, not a build timestamp.

The Data and downloads page offers equivalent JSON and CSV findings and a public coverage JSON export. These describe eligible public records only, not the completeness of the private intake.

## Data policy

No inferred measurements, identifiers, citations, or regulatory limits. Empty data is a gap, not a measured zero. Quantitative claims must trace to a source page. Aggregate fluorine results are distinct from individual PFAS results. Source citation metadata reflects verified bibliographic fields only.

`)
console.log("robots.txt and llms.txt: PASS")
