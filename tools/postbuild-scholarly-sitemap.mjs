import fs from "node:fs"
import { published, simplify, esc } from "./lib/wiki.mjs"
const rows = published().filter(page => page.data.type === "source")
fs.writeFileSync("public/sitemap-scholarly.xml", `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${rows.map(page => `<url><loc>https://foreverchemicalsindex.com/${esc(simplify(page.slug))}</loc></url>`).join("")}</urlset>`)
console.log("Scholarly sitemap: PASS")
