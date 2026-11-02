import fs from "node:fs"
import { published, esc, jsonScript } from "./lib/wiki.mjs"
import { pageMetadata } from "./lib/metadata.mjs"
for (const page of published()) {
  const file = `public/${page.slug}.html`
  if (!fs.existsSync(file)) throw new Error(`Missing built page: ${file}`)
  const { graph, fields } = pageMetadata(page)
  const meta = fields.map(([name, value]) => `<meta name="${name}" content="${esc(value)}">`).join("")
  let html = fs.readFileSync(file, "utf8").replace(/<meta name="citation_[^"]+"[^>]*>/g, "").replace(/<script data-fci-schema="main"[\s\S]*?<\/script>/g, "")
  html = html.replace("</head>", `${meta}<script data-fci-schema="main" type="application/ld+json">${jsonScript({ "@context": "https://schema.org", "@graph": graph })}</script></head>`)
  fs.writeFileSync(file, html)
}
console.log("JSON-LD and source citation metadata: PASS")
