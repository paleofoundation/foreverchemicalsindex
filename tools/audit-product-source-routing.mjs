// Adapted from HMI: no inherited or inferred PFAS category routes.
import { findingIssue } from "./lib/discovery.mjs"
import { pages, sources, fail, publicationContext } from "./lib/wiki.mjs"
import { isPublicWikiRecord } from "./lib/source-publication.mjs"
const all = new Map(pages().map(page => [page.slug,page])), errors = [], context = publicationContext([...all.values()])
for (const page of sources()) {
  const { data } = page
  for (const [field, family] of [["products","products"],["analytes","analytes"]]) {
    if (data[field] !== undefined && !Array.isArray(data[field])) { errors.push(`${page.file}: ${field} must be an array`); continue }
    for (const slug of data[field] ?? []) if (!all.has(`${family}/${slug}`)) errors.push(`${page.file}: unknown ${family}/${slug}`)
  }
  if (!Array.isArray(data.findings ?? [])) { errors.push(`${page.file}: findings must be an array`); continue }
  for (const row of data.findings ?? []) {
    const issue = findingIssue(row)
    if (issue) errors.push(`${page.file}: ${issue}`)
    if (!isPublicWikiRecord(data,page.slug) || data.review_state !== "approved_for_public") errors.push(`${page.file}: unreviewed findings cannot be published`)
    for (const field of ["product","analyte","value","unit","basis","source_location"]) if (typeof row[field] !== "string" || !row[field].trim()) errors.push(`${page.file}: finding missing ${field}`)
    for (const [key, family] of [["product","products"],["analyte","analytes"]]) {
      if (!all.has(`${family}/${row[key]}`)) errors.push(`${page.file}: finding destination missing`)
      else if (!isPublicWikiRecord(all.get(`${family}/${row[key]}`).data, `${family}/${row[key]}`, context)) errors.push(`${page.file}: finding destination is private`)
      if (!Array.isArray(data[family]) || !data[family].includes(row[key])) errors.push(`${page.file}: undeclared ${key} route`)
    }
  }
}
for (const page of all.values()) for (const source of page.data.sources ?? []) if (!all.has(`sources/${source}`)) errors.push(`${page.file}: missing source ${source}`)
fail(errors, "audit-product-source-routing")
