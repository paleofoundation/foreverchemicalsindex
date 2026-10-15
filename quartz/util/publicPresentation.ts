import type { Element, Root, RootContent } from "hast"
import { toString } from "hast-util-to-string"
import { visit, SKIP } from "unist-util-visit"
import { toHtml } from "hast-util-to-html"
import { citationReviewIssue, isSourceRecord } from "../../tools/lib/source-publication.mjs"

const element = (tagName: string, children: RootContent[], properties: Element["properties"] = {}): Element =>
  ({ type: "element", tagName, properties, children: children as Element["children"] })
const text = (value: string): RootContent => ({ type: "text", value })
const classes = (node: RootContent) => node.type === "element" ? String(node.properties.className ?? "").split(/[, ]+/) : []
const labels: Record<string, string> = {
  "Literature Evidence Summary": "Evidence summary",
  "Structured Concentration Rows": "Measured concentrations",
  "Extracted Formula Concentration Rows": "Measured concentrations",
  "Broad Product Context: Author-Scope Index": "Supporting evidence and scope",
  "Page Completeness": "Evidence gaps",
  "Row Mapping": "Scope and comparability",
  "Levers to reduce contamination": "Controls and mitigation",
  "What Drives Variance Across Brands": "Sources of variation",
}
const placeholder = /^(?:Generator-managed section: will be populated|Source evidence inventory pending structured extraction)/i
const headingText = (node: RootContent) => toString(node).replace(/\s*#\s*$/, "").trim()

/** Change presentation only. Source files, data values, units and citation links stay intact. */
export function presentArticle(tree: Root, fm: Record<string, unknown>, slug: string) {
  const topic = ["product-category", "ingredient", "metal", "regulator"].includes(String(fm.type))
  const omitted: string[] = []
  const notes: RootContent[] = []
  const countBased = /Confidence rating\..*(?:Source-count|1[–-]2 sources)/i.test(toString(tree))

  if (topic) {
    const sections: { title: string; nodes: RootContent[]; order: number }[] = []
    let current = { title: "", nodes: [] as RootContent[], order: 0 }
    sections.push(current)
    for (const node of tree.children) {
      if (node.type === "element" && node.tagName === "h2") {
        current = { title: headingText(node), nodes: [], order: sections.length }
        sections.push(current)
      }
      current.nodes.push(node)
    }
    const kept = sections.filter((section) => {
      const meaningful = section.nodes.slice(1).filter((node) => node.type !== "comment" && toString(node).trim())
      const empty = meaningful.length > 0 && meaningful.every((node) => node.type === "element" && node.tagName === "p" && placeholder.test(toString(node).trim()))
      if (empty) {
        const heading = section.nodes[0] as Element
        if (heading.properties.id) omitted.push(String(heading.properties.id))
      }
      return !empty
    })
    for (const section of kept) {
      if (/^Who this page is for$/i.test(section.title) && section.nodes.some((node) => classes(node).includes("hmi-stakeholder-guide"))) {
        const heading = section.nodes[0] as Element
        section.nodes[0] = element("span", [], heading.properties.id ? { id: heading.properties.id } : {})
      }
    }
    // Preserve anchors and within-section order. References remain tied to
    // their original works when the reader's route through a page improves.
    if (fm.type === "product-category") {
      const rank = (title: string) => {
        if (!title || /^overview$/i.test(title)) return 0
        if (/who this page is for|row mapping|row relationship|literature scope/i.test(title)) return 1
        if (/literature evidence summary|key findings/i.test(title)) return 10
        if (/measured values|concentration rows|source evidence inventory|distribution context|broad (?:product|formula) context|current source links|evidence used for/i.test(title)) return 20
        if (/limits|benchmark context/i.test(title)) return 30
        if (/ingredient drivers|variance|levers|mitigation/i.test(title)) return 40
        if (/completeness|gaps|open questions/i.test(title)) return 50
        if (/^methodology$|evidence governance/i.test(title)) return 80
        if (/^references$/i.test(title)) return 90
        if (/^sources$/i.test(title)) return 91
        if (/update history|page history/i.test(title)) return 99
        return 45
      }
      kept.sort((a, b) => rank(a.title) - rank(b.title) || a.order - b.order)
    }
    tree.children = kept.flatMap((section) => section.nodes)
    if (omitted.length) {
      notes.push(element("aside", [
        ...omitted.map((id) => element("span", [], { id })),
        element("p", [text("Some evidence sections are still under review. Missing results do not establish that a metal is absent, below detection, or unregulated.")]),
      ], { className: ["hmi-publication-note"], ariaLabel: "Evidence review status" }))
    }
  }

  if (isSourceRecord(fm, slug)) {
    const issue = citationReviewIssue(fm)
    if (issue) notes.push(element("aside", [element("p", [text(`${issue}. This record is retained for traceability and is not included in public citation lists or search until its bibliographic review is complete.`)])], { className: ["hmi-publication-note"] }))
  }

  let currentHeading = "Evidence"
  const variantGroups = new Set<string>()
  visit(tree, "element", (node, index, parent) => {
    if (classes(node).includes("hmi-variant-group") && parent && index !== undefined) {
      const key = toHtml(node)
      if (variantGroups.has(key)) {
        parent.children.splice(index, 1)
        return index
      }
      variantGroups.add(key)
    }
    if (/^h[2-4]$/.test(node.tagName)) {
      const original = headingText(node)
      currentHeading = labels[original] ?? original
      if (topic && labels[original]) {
        // Keep the existing ID so bookmarked and generated links still work.
        const anchor = node.children.filter((child) => child.type === "element" && child.tagName === "a" && child.properties.role === "anchor")
        node.children = [text(labels[original]), ...anchor] as Element["children"]
      }
    }
    if (topic && classes(node).includes("hmi-stakeholder-guide")) {
      const links: Element[] = []
      const hrefs = new Set<string>()
      visit(node, "element", (child) => {
        if (child.tagName === "a" && typeof child.properties.href === "string" && !hrefs.has(child.properties.href)) {
          links.push(child)
          hrefs.add(child.properties.href)
        }
      })
      node.tagName = "details"
      node.properties = { className: ["hmi-reading-guide"] }
      node.children = [
        element("summary", [text("Reading guide")]),
        element("p", [text("Legal, regulatory and retailer teams can use the cited measurements, applicable limits and study limitations to assess the evidence for this category.")]),
        element("p", [text("Quality teams can examine product form, measurement basis and sources of variation. Journalists and researchers can follow each reference to the original findings and methods.")]),
        ...(links.length ? [element("p", [text("Related tools and pages: "), ...links.flatMap((link, index) => index ? [text(" · "), link] : [link])])] : []),
      ] as Element["children"]
      return SKIP
    }
    if (topic && node.tagName === "p" && /^Confidence rating\./i.test(toString(node)) && countBased) {
      node.children = [text("Source coverage. Low denotes 1–2 contributing sources, medium 3–10, and high more than 10. These counts describe coverage, not study quality, agreement, or scientific confidence.")] as Element["children"]
    }
    if (topic && countBased && node.tagName === "th" && /^Confidence$/i.test(toString(node).trim())) node.children = [text("Source coverage")] as Element["children"]
    if (node.tagName === "table" && parent && index !== undefined && !classes(parent as RootContent).includes("hmi-table-scroll")) {
      if (topic && countBased) visit(node, "element", (cell) => {
        if (cell.tagName === "th" && /^Confidence$/i.test(toString(cell).trim())) cell.children = [text("Source coverage")] as Element["children"]
      })
      const wrapper = element("div", [node], { className: ["hmi-table-scroll"], tabIndex: 0, role: "region", ariaLabel: `${currentHeading}: scrollable table` })
      parent.children[index] = wrapper
      return SKIP
    }
  })
  tree.children.unshift(...notes)
  const headings: { id: string; text: string }[] = []
  visit(tree, "element", (node) => {
    if (/^h[1-6]$/.test(node.tagName) && node.properties.id) headings.push({ id: String(node.properties.id), text: headingText(node) })
  })
  return { omitted, headings }
}
