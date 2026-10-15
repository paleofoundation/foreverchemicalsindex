// Adapted from HMI: source-backed records only, with analytes replacing metals.
import fs from "node:fs"
import { published, findings, replaceBlock, esc } from "./lib/wiki.mjs"
const all = published(), rows = findings()
for (const section of ["products","analytes","sources","regulations","regulators"]) {
  const entries = all.filter(page => page.slug.startsWith(`${section}/`) && page.slug !== `${section}/index`)
  replaceBlock(`wiki/${section}/index.md`, "directory", entries.map(page => `- [[${page.slug}|${page.data.title}]]`).join("\n"))
}
fs.mkdirSync("wiki/static", { recursive: true })
fs.writeFileSync("wiki/static/contamination.json", JSON.stringify({ status: rows.length ? "reviewed-records" : "awaiting-evidence", records: rows }, null, 2) + "\n")
const fields = ["product","analyte","value","unit","basis","source_location","source"]
const csv = value => `"${String(value ?? "").replaceAll('"','""')}"`
fs.writeFileSync("wiki/static/contamination.csv", fields.join(",") + "\n" + rows.map(row => fields.map(field => csv(row[field])).join(",") + "\n").join(""))
const table = `<table><thead><tr>${fields.map(field => `<th>${field.replaceAll("_"," ")}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${fields.map(field => `<td>${field === "source" ? `<a href="/${esc(row[field])}">${esc(row[field])}</a>` : esc(row[field])}</td>`).join("")}</tr>`).join("")}</tbody></table>`
replaceBlock("wiki/data.md", "evidence", table)
console.log(`Generated dataset: ${rows.length} evidence rows; directories read from wiki/analytes and peer sections.`)
