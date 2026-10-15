import fs from "node:fs"
const base="https://foreverchemicalsindex.com"
fs.writeFileSync("public/robots.txt",`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`)
fs.writeFileSync("public/llms.txt",`# Forever Chemicals Index

A source-traceable PFAS reference under preparation. Product and analyte entries are scaffold pages, not evidence of contamination or safety.

## Sections

- [Products](${base}/products): generic category destinations.
- [Analytes](${base}/analytes): substances, classes, and aggregate measures.
- [Sources](${base}/sources): reviewed primary evidence when available.
- [Regulations](${base}/regulations): verified primary instruments when available.
- [Regulators](${base}/regulators): issuing authorities when verified.

## Data policy

No inferred measurements, identifiers, citations, or regulatory limits. Empty data is a gap, not a measured zero. Quantitative claims must trace to a source page. Aggregate fluorine results are distinct from individual PFAS results. Source citation metadata reflects verified bibliographic fields only.

- [Methodology](${base}/methodology)
- [Editorial standards](${base}/editorial-standards)
- [Data](${base}/data)
- [Errata](${base}/errata)
`)
console.log("robots.txt and llms.txt: PASS")
