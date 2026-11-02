import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/backlinks.scss"
import { FullSlug, SimpleSlug, resolveRelative, simplifySlug } from "../util/path"
import { classNames } from "../util/lang"
import { inboundIndex } from "../util/conceptEdges"
import OverflowListFactory from "./OverflowList"

// "Referenced by" , the pages that point at this one. This is the crawlable,
// LLM-extractable relationship surface: a rendered list of <a> edges (unlike the
// interactive Graph, which is a canvas invisible to crawlers). Because the
// ConceptLinks transformer folds structured frontmatter relationships into every
// page's `links`, this list reflects the REAL relationship graph , a analyte page
// lists the regulations, products, and ingredients that concern it, not just the
// handful that happen to link it in prose.
//
// Sources are excluded as entries: a page's evidence is reached through its own
// citations/references, not through a backlinks list, and a hub analyte would
// otherwise list hundreds of source pages (mirrors relatedGraph.ts). Retired
// redirect stubs are excluded on both ends.

// Grouping order: the regulatory/product/ingredient context first, then the
// analyte hubs, then synthesis and mitigation. Unknown namespaces sort last.
const CAT_ORDER = ["regulations", "products", "ingredients", "analytes", "synthesis", "mitigation"]

// Hub pages (a common analyte is referenced by hundreds of ingredients/products/
// regulations) would otherwise ship a firehose of <a> tags on every analyte page,
// which dilutes crawl signal and bloats the HTML. Cap the visible sample and
// state the true total; the complete, uncapped relationship set lives in the
// structured evidence export (contentIndex / evidence-packet JSON).
const MAX_BACKLINKS = 48

// slug -> file lookup, cached per allFiles reference (stable across a build) so
// rendering N pages does not cost O(N^2).
let cachedFiles: unknown = null
let cachedBySlug: Map<SimpleSlug, any> | null = null
function bySlug(allFiles: any[]): Map<SimpleSlug, any> {
  if (cachedBySlug && cachedFiles === allFiles) return cachedBySlug
  const m = new Map<SimpleSlug, any>()
  for (const f of allFiles) {
    if (f.slug) m.set(simplifySlug(f.slug as FullSlug), f)
  }
  cachedFiles = allFiles
  cachedBySlug = m
  return m
}

export default (() => {
  const { OverflowList, overflowListAfterDOMLoaded } = OverflowListFactory()

  const Backlinks: QuartzComponent = ({
    fileData,
    allFiles,
    displayClass,
  }: QuartzComponentProps) => {
    const mySlug = fileData.slug
    if (!mySlug) return null
    const fmSelf = (fileData.frontmatter ?? {}) as any
    // No relationship apparatus on retired redirect stubs, tag pages, or the
    // list/index pages (their inbound sets are navigational, not topical).
    if (fmSelf.retired === true) return null
    if (mySlug === "index" || mySlug.endsWith("/index") || mySlug.startsWith("tags/")) return null

    const simple = simplifySlug(mySlug)
    const lookup = bySlug(allFiles)
    const inbound = inboundIndex(allFiles).get(simple) ?? new Set<SimpleSlug>()

    type Entry = { href: string; label: string; cat: string }
    const entries: Entry[] = []
    for (const from of inbound) {
      if (from === simple) continue
      const f = lookup.get(from)
      if (!f || !f.slug) continue
      const fm = (f.frontmatter ?? {}) as any
      if (fm.retired === true) continue
      const cat = from.split("/")[0]
      if (cat === "sources" || fm.type === "source") continue // evidence, not lateral nav
      const label = String(fm.title ?? from.split("/").pop() ?? from)
      entries.push({ href: resolveRelative(mySlug, f.slug as FullSlug), label, cat })
    }
    if (entries.length === 0) return null

    entries.sort((a, b) => {
      const ai = CAT_ORDER.indexOf(a.cat)
      const bi = CAT_ORDER.indexOf(b.cat)
      const ao = ai === -1 ? CAT_ORDER.length : ai
      const bo = bi === -1 ? CAT_ORDER.length : bi
      if (ao !== bo) return ao - bo
      return a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
    })

    const total = entries.length
    const shown = entries.slice(0, MAX_BACKLINKS)

    return (
      <div class={classNames(displayClass, "backlinks")}>
        <h3>Referenced by{total > MAX_BACKLINKS ? <span class="backlinks-count"> {total}</span> : null}</h3>
        <OverflowList>
          {shown.map((e) => (
            <li>
              <a href={e.href} class="internal">
                {e.label}
              </a>
            </li>
          ))}
        </OverflowList>
        {total > MAX_BACKLINKS ? (
          <p class="backlinks-more">
            Showing {MAX_BACKLINKS} of {total}. The complete relationship set is available in the
            structured evidence export.
          </p>
        ) : null}
      </div>
    )
  }

  Backlinks.css = style
  Backlinks.afterDOMLoaded = overflowListAfterDOMLoaded

  return Backlinks
}) satisfies QuartzComponentConstructor
