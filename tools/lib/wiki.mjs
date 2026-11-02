import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import { isPublicWikiRecord } from "./source-publication.mjs"
export const root = process.cwd()
export function pages(dir = "wiki") {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name)
    if (entry.name.startsWith("_") || entry.name === "static") return []
    if (entry.isDirectory()) return pages(file)
    if (!file.endsWith(".md")) return []
    const { data, content } = matter.read(file)
    return [{ file, slug: path.relative("wiki", file).replace(/\.md$/, ""), data, content }]
  }).sort((a,b) => a.slug.localeCompare(b.slug))
}
export function publicationContext(all = pages()) { return { sources: all.filter(page => page.data.type === "source" && isPublicWikiRecord(page.data, page.slug)).map(page => page.data) } }
export function published() { const all = pages(), context = publicationContext(all); return all.filter(page => isPublicWikiRecord(page.data, page.slug, context)) }
export const sources = () => pages().filter(page => page.data.type === "source")
export const simplify = slug => slug.replace(/\/index$/, "").replace(/^index$/, "")
export function fail(errors, label) {
  if (errors.length) { console.error(errors.join("\n")); process.exit(1) }
  console.log(`${label}: PASS`)
}
export function replaceBlock(file, marker, body) {
  const text = fs.readFileSync(file, "utf8")
  const pattern = new RegExp(`<!-- BEGIN: ${marker} -->[\\s\\S]*?<!-- END: ${marker} -->`)
  fs.writeFileSync(file, text.replace(pattern, `<!-- BEGIN: ${marker} -->\n${body}\n<!-- END: ${marker} -->`))
}
export const esc = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;")
export const jsonScript = value => JSON.stringify(value).replaceAll("<", "\\u003c")
export function findings() {
  return published().filter(page => page.data.type === "source").flatMap(page =>
    (page.data.findings ?? []).map(row => ({ ...row, source: page.slug })))
}
