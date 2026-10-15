import fs from "node:fs"
import { published, simplify, jsonScript } from "./lib/wiki.mjs"
const base = "https://foreverchemicalsindex.com"
for (const page of published()) {
  const crumbs = [{name:"Index",item:`${base}/`}]
  const parts = page.slug.split("/")
  if (parts.length > 1) crumbs.push({name:parts[0][0].toUpperCase()+parts[0].slice(1),item:`${base}/${parts[0]}`})
  if (page.slug !== "index" && !page.slug.endsWith("/index")) crumbs.push({name:page.data.title,item:`${base}/${simplify(page.slug)}`})
  const schema = {"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:crumbs.map((crumb,i) => ({"@type":"ListItem",position:i+1,...crumb}))}
  const file=`public/${page.slug}.html`
  const html=fs.readFileSync(file,"utf8").replace(/<script data-fci-schema="breadcrumbs"[\s\S]*?<\/script>/g,"")
  fs.writeFileSync(file,html.replace("</head>",`<script data-fci-schema="breadcrumbs" type="application/ld+json">${jsonScript(schema)}</script></head>`))
}
console.log("BreadcrumbList metadata: PASS")
