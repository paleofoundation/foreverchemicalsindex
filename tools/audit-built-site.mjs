import fs from "node:fs"
import path from "node:path"
import { published, simplify, fail } from "./lib/wiki.mjs"
const errors = [], base = "https://foreverchemicalsindex.com"
const exists = target => [target,`${target}.html`,path.join(target,"index.html")].some(p => fs.existsSync(p) && fs.statSync(p).isFile())
for (const page of published()) {
  const file = `public/${page.slug}.html`, html = fs.readFileSync(file,"utf8")
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]
  if (canonical?.replace(/\/$/,"") !== `${base}/${simplify(page.slug)}`.replace(/\/$/,"")) errors.push(`${file}: canonical mismatch`)
  const schemas = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]))
  if (!schemas.some(schema => schema["@type"] === "BreadcrumbList")) errors.push(`${file}: missing breadcrumbs`)
  if (!schemas.some(schema => schema["@graph"]?.some(item => item["@type"] === "WebSite"))) errors.push(`${file}: missing WebSite`)
  if (!/<h1[ >]/.test(html)) errors.push(`${file}: missing visible page title`)
  if (/\u2014|foreverchemicalstested|heavymetal(?:certified|tested)|HMT&?C\b|G-74X1550KX7|sy1JoHaUgb_tWsBU/i.test(html)) errors.push(`${file}: inherited or forbidden text`)
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const href=match[1]
    if (/^(?:https?:|data:|mailto:|#)/.test(href)) continue
    const clean=decodeURIComponent(href.split(/[?#]/)[0])
    const target=clean.startsWith("/") ? path.join("public",clean) : path.join(path.dirname(file),clean)
    if (!exists(target)) errors.push(`${file}: dead asset or link ${href}`)
  }
}
for (const file of ["sitemap.xml","sitemap-scholarly.xml","robots.txt","llms.txt"]) if (!fs.existsSync(`public/${file}`)) errors.push(`Missing ${file}`)
const dataset=JSON.parse(fs.readFileSync("public/static/contamination.json","utf8"))
if (!Array.isArray(dataset.records)) errors.push("Invalid dataset")
if (fs.existsSync("public/sources/_TEMPLATE.html")) errors.push("Private source template leaked")
fail(errors,"audit-built-site")
