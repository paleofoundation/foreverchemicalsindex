import fs from "node:fs"
import { published } from "./lib/wiki.mjs"
import { evidenceApparatus, apparatusHtml, publicEvidence } from "./lib/metadata.mjs"
const eligible = published(), records = eligible.map(page => evidenceApparatus(page, eligible))
for (const record of records) {
  const file = `public/${record.slug}.html`
  let html = fs.readFileSync(file, "utf8").replace(/<!-- BEGIN: public-evidence -->[\s\S]*?<!-- END: public-evidence -->/g, "")
  const apparatus = apparatusHtml({ ...record, references: /id="references"/.test(html) ? [] : record.references, routedSources: /id="sources"/.test(html) ? [] : record.routedSources })
  if (apparatus) {
    if (!html.includes("</article>")) throw new Error(`${file}: missing reading article`)
    html = html.replace("</article>", `<!-- BEGIN: public-evidence -->${apparatus}<!-- END: public-evidence --></article>`)
  }
  fs.writeFileSync(file, html)
}
fs.writeFileSync("public/static/public-evidence.json", JSON.stringify(publicEvidence(eligible), null, 2) + "\n")
console.log(`Public evidence apparatus: ${records.length} pages`)
