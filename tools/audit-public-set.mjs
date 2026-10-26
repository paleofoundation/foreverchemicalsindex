import fs from "node:fs"
import path from "node:path"
import { pages, published, findings, simplify, fail } from "./lib/wiki.mjs"
const errors = [], all = pages(), eligible = published(), expected = new Set(eligible.map(p => p.slug))
const walk = dir => fs.readdirSync(dir,{withFileTypes:true}).flatMap(e => e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)])
const html = walk("public").filter(f=>f.endsWith(".html")).map(f=>f.slice(7,-5)).filter(s=>s!=="404")
if (JSON.stringify([...expected].sort())!==JSON.stringify(html.sort())) errors.push("HTML differs from eligible public set")
const index = JSON.parse(fs.readFileSync("public/static/contentIndex.json","utf8"))
if (JSON.stringify(Object.keys(index).sort())!==JSON.stringify([...expected].sort())) errors.push("Search differs from eligible public set")
const ask = JSON.parse(fs.readFileSync("public/static/askIndex.json", "utf8"))
if (Object.keys(ask).some(slug => !expected.has(slug))) errors.push("Answer excerpts contain private records")
const sitemap = fs.readFileSync("public/sitemap.xml","utf8")
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>new URL(m[1]).pathname.replace(/^\//,"").replace(/\/$/,""))
if (JSON.stringify(urls.sort())!==JSON.stringify(eligible.map(p=>simplify(p.slug)).sort())) errors.push("Sitemap differs from eligible public set")
const guide = fs.readFileSync("public/llms.txt","utf8")
const guidePaths = [...guide.matchAll(/\]\((https:\/\/foreverchemicalsindex.com[^)]*)\)/g)].map(m=>new URL(m[1]).pathname.replace(/^\//, "").replace(/\/$/, ""))
if (JSON.stringify(guidePaths.sort())!==JSON.stringify(eligible.map(p=>simplify(p.slug)).sort())) errors.push("Guide differs from eligible public set")
for (const p of all.filter(p=>!expected.has(p.slug))) if (fs.existsSync(`public/${p.slug}.html`)) errors.push(`Private page leaked: ${p.slug}`)
const dataset = JSON.parse(fs.readFileSync("public/static/contamination.json","utf8"))
if (JSON.stringify(dataset.records)!==JSON.stringify(findings())) errors.push("Evidence export differs from eligible findings")
const fields = ["product","analyte","value","unit","basis","source_location","source"]
const quote = value => `"${String(value ?? "").replaceAll('"','""')}"`
const csv = fields.join(",") + "\n" + dataset.records.map(row=>fields.map(f=>quote(row[f])).join(",")+"\n").join("")
if (fs.readFileSync("public/static/contamination.csv","utf8")!==csv) errors.push("CSV differs from eligible findings")
const scholarly = [...fs.readFileSync("public/sitemap-scholarly.xml","utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>new URL(m[1]).pathname.slice(1))
if (JSON.stringify(scholarly.sort())!==JSON.stringify(eligible.filter(p=>p.data.type==="source").map(p=>simplify(p.slug)).sort())) errors.push("Scholarly sitemap differs from eligible sources")
fail(errors,`audit-public-set (${expected.size} eligible pages; ${dataset.records.length} findings)`)
