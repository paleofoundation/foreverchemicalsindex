import fs from "node:fs"
import {published,fail} from "./lib/wiki.mjs"
const errors=[]
for(const page of published()) {
 const html=fs.readFileSync(`public/${page.slug}.html`,"utf8")
 if([...html.matchAll(/<h1(?:\s|>)/g)].length!==1) errors.push(`${page.slug}: exactly one H1 required`)
 for(const token of ['href="#main-content"','id="main-content"','id="fci-primary-navigation"','aria-controls="fci-primary-navigation"','id="fci-search-dialog"','aria-labelledby="fci-search-title"','id="fci-search-input"','role="status"']) if(!html.includes(token))errors.push(`${page.slug}: missing reading/accessibility contract ${token}`)
 if(/TEST ONLY|SYNTHETIC-TEST/.test(html))errors.push(`${page.slug}: synthetic QA content leaked`)
}
for(const slug of ["test-only-detail","test-only-source"])if(fs.existsSync(`public/${slug}.html`))errors.push("QA fixture published")
fail(errors,`audit-reading-layout (${published().length} public pages)`)
