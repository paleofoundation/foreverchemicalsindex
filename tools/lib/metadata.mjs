import { simplify, esc } from "./wiki.mjs"
export const base = "https://foreverchemicalsindex.com"
export const pageUrl = page => `${base}/${simplify(page.slug)}${page.slug.endsWith("/index") ? "/" : ""}`
const sourceTypes = new Map([["journal-article", "ScholarlyArticle"], ["peer-reviewed-article", "ScholarlyArticle"], ["government-report", "Report"], ["technical-report", "Report"], ["dataset", "Dataset"], ["legislation", "Legislation"]])
export const sourceType = data => sourceTypes.get(String(data.source_type ?? "").replaceAll("_", "-")) ?? "CreativeWork"
export function sourceMetadata(page) {
  const d = page.data, url = pageUrl(page), type = sourceType(d)
  const work = { "@type": type, "@id": `${url}#source`, name: d.title, url, datePublished: String(d.year), sameAs: d.access_url }
  // Names alone do not establish Person versus Organization. Explicit entities must
  // match the verified bibliography; government issuers are organizations.
  const authors = (d.author_entities ?? []).filter(a => d.authors.includes(a.name) && ["Person", "Organization"].includes(a.type)).map(a => ({ "@type": a.type, name: a.name }))
  if (d.issuing_body && d.authors.includes(d.issuing_body)) {
    const index = authors.findIndex(a => a.name === d.issuing_body)
    if (index !== -1) authors.splice(index, 1)
    authors.push({ "@type": "Organization", name: d.issuing_body })
  }
  if (authors.length) work.author = authors
  if (type === "ScholarlyArticle") { work.headline = d.title; work.isPartOf = { "@type": "Periodical", name: d.publication } }
  if (d.doi) work.identifier = { "@type": "PropertyValue", propertyID: "DOI", value: d.doi }
  const fields = [["citation_title", d.title], ...d.authors.map(name => ["citation_author", name]), ["citation_publication_date", d.year], ["citation_abstract_html_url", url]]
  if (type === "ScholarlyArticle") fields.push(["citation_journal_title", d.publication])
  if (d.doi) fields.push(["citation_doi", d.doi])
  // Access URLs are not asserted to be HTML full text or redistributable PDFs.
  return { work, fields }
}
export function pageMetadata(page) {
  const url = pageUrl(page), organization = { "@type": "Organization", "@id": `${base}/#organization`, name: "Forever Chemicals Index", url: base }
  const graph = [organization, { "@type": "WebSite", "@id": `${base}/#website`, url: base, name: "Forever Chemicals Index", publisher: { "@id": organization["@id"] } }]
  const webPage = { "@type": page.data.type === "section-index" ? "CollectionPage" : "WebPage", "@id": `${url}#webpage`, url, name: page.data.title, isPartOf: { "@id": `${base}/#website` } }
  let fields = []
  if (page.data.type === "source") {
    const source = sourceMetadata(page); graph.push(source.work); fields = source.fields
    webPage.mainEntity = { "@id": source.work["@id"] }
  }
  if (page.slug === "data") {
    webPage.mainEntity = { "@id": `${url}#dataset` }
    graph.push({ "@type": "Dataset", "@id": `${url}#dataset`, name: "Forever Chemicals Index evidence dataset", url, description: "Reviewed public evidence export. Empty records mean evidence is awaiting review, not findings of absence.", creator: { "@id": organization["@id"] }, distribution: [ ["json", "application/json"], ["csv", "text/csv"] ].map(([ext, encodingFormat]) => ({ "@type": "DataDownload", contentUrl: `${base}/static/contamination.${ext}`, encodingFormat })) })
  }
  graph.push(webPage)
  return { graph, fields }
}
export function evidenceApparatus(page, eligible) {
  const sources = eligible.filter(p => p.data.type === "source"), allowed = new Map(sources.map(p => [p.slug, p]))
  // Only explicit body links count as References, never routing/frontmatter.
  // Strip examples/code/comments so sample citation syntax cannot become a citation.
  const body = page.content.replace(/<!--[\s\S]*?-->/g, "").replace(/```[\s\S]*?```|`[^`]*`/g, "")
  const targets = [...body.matchAll(/\[\[(sources\/[^\]|#]+)(?:[^\]]*)\]\]|\]\((?:\/)?(sources\/[^)#?]+)(?:#[^)]*)?\)/g)].map(m => (m[1] ?? m[2]).replace(/\.md$/, ""))
  const references = [...new Set(targets)].filter(slug => allowed.has(slug)).map(slug => ({ slug, url: pageUrl(allowed.get(slug)), title: allowed.get(slug).data.title }))
  const [section, identity] = page.slug.split("/")
  const routedSources = ["products", "analytes", "regulations", "regulators"].includes(section) && identity !== "index" ? sources.filter(p => p.data[section]?.includes(identity)).map(p => ({ slug: p.slug, url: pageUrl(p), title: p.data.title })) : []
  const findingCount = sources.flatMap(p => (p.data.findings ?? []).map(row => ({ ...row, source: p.slug }))).filter(row => page.slug === "data" || (section === "products" && row.product === identity) || (section === "analytes" && row.analyte === identity) || page.slug === row.source).length
  // Revision entries need a separate future review contract. No build/git dates
  // or unvalidated frontmatter history is promoted as editorial history.
  return { slug: page.slug, url: pageUrl(page), references, routedSources, coverage: { citedSources: references.length, routedSources: routedSources.length, publishedFindings: findingCount }, revisions: [], revisionStatus: "no-reviewed-revision-records" }
}
export function apparatusHtml(record) {
  const list = items => `<ul>${items.map(item => `<li><a href="${esc(item.url)}">${esc(item.title)}</a></li>`).join("")}</ul>`
  // Do not create empty References/Sources headings or pretend a policy page has
  // a scientific history. The complete empty state is available in the export.
  return (record.references.length ? `<section aria-label="References"><h2 id="references">References</h2><p>Sources explicitly cited in this page's body.</p>${list(record.references)}</section>` : "") + (record.routedSources.length ? `<section aria-label="Sources"><h2 id="sources">Sources</h2><p>Reviewed sources routed to this profile; routing alone does not support every claim.</p>${list(record.routedSources)}</section>` : "")
}

export function publicEvidence(eligible) {
  const sources = eligible.filter(p => p.data.type === "source"), publishedFindings = sources.flatMap(p => p.data.findings ?? []).length
  return { version: 1, status: publishedFindings ? "reviewed-records" : "awaiting-evidence", scope: "Public eligible records only; empty coverage is not evidence of absence or a count of the private intake.", totals: { publishedSources: sources.length, publishedFindings }, pages: eligible.map(page => evidenceApparatus(page, eligible)) }
}
