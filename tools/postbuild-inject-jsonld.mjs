// Adapted from HMI: metadata derives only from verified frontmatter.
import fs from "node:fs"
import { published, simplify, esc, jsonScript } from "./lib/wiki.mjs"
const base = "https://foreverchemicalsindex.com"
const organization = { "@type":"Organization", "@id":`${base}/#organization`, name:"Forever Chemicals Index", url:base }
for (const page of published()) {
  const file = `public/${page.slug}.html`
  if (!fs.existsSync(file)) throw new Error(`Missing built page: ${file}`)
  const url = `${base}/${simplify(page.slug)}`
  const graph = [organization, { "@type":"WebSite", "@id":`${base}/#website`, url:base, name:"Forever Chemicals Index", publisher:{"@id":organization["@id"]} }]
  const data = page.data
  let meta = ""
  if (page.slug === "data") graph.push({"@type":"Dataset",name:"Forever Chemicals Index evidence dataset",url,description:"Placeholder awaiting reviewed evidence. Empty records are not findings of absence.",creator:{"@id":organization["@id"]}})
  if (data.type === "source") {
    const article = {"@type":"ScholarlyArticle", "@id":`${url}#source`, headline:data.title, url, author:data.authors.map(name => ({"@type":"Person",name})), datePublished:String(data.year), isPartOf:{"@type":"Periodical",name:data.publication}, sameAs:data.access_url}
    if (data.doi) article.identifier = {"@type":"PropertyValue",propertyID:"DOI",value:data.doi}
    graph.push(article)
    const fields = [["citation_title", data.title], ...data.authors.map(name => ["citation_author",name]), ["citation_publication_date",data.year], ["citation_journal_title",data.publication], ["citation_doi",data.doi], ["citation_fulltext_html_url",data.access_url]]
    meta = fields.filter(([,value]) => value).map(([name,value]) => `<meta name="${name}" content="${esc(value)}">`).join("")
  }
  let html = fs.readFileSync(file,"utf8").replace(/<meta name="citation_[^"]+"[^>]*>/g, "").replace(/<script data-fci-schema="main"[\s\S]*?<\/script>/g,"")
  html = html.replace("</head>", `${meta}<script data-fci-schema="main" type="application/ld+json">${jsonScript({"@context":"https://schema.org","@graph":graph})}</script></head>`)
  fs.writeFileSync(file,html)
}
console.log("JSON-LD and source citation metadata: PASS")
