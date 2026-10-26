import fs from "node:fs"
import { published, simplify } from "./lib/wiki.mjs"
const base="https://foreverchemicalsindex.com"
fs.writeFileSync("public/robots.txt",`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`)
fs.writeFileSync("public/llms.txt",`# Forever Chemicals Index

A source-traceable PFAS reference under preparation. No reviewed occurrence findings are published. Planned profiles remain private until discovery and review gates are met.

## Public pages

${published().map(page => `- [${page.data.title}](${base}/${simplify(page.slug)}): ${page.data.type === "section-index" ? "Public section directory; planned profiles remain private." : "Reference scope and evidence policy."}`).join("\n")}

## Data policy

No inferred measurements, identifiers, citations, or regulatory limits. Empty data is a gap, not a measured zero. Quantitative claims must trace to a source page. Aggregate fluorine results are distinct from individual PFAS results. Source citation metadata reflects verified bibliographic fields only.

`)
console.log("robots.txt and llms.txt: PASS")
