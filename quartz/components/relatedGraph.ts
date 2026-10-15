import { QuartzComponentProps } from "./types"
import { resolveRelative, simplifySlug } from "../util/path"

// The bidirectional concept graph for a page, extracted from RelatedPages so
// the right rail's "Connections" block and the in-body "See also" block are
// computed from ONE traversal rather than two that can drift apart.
//
// Both directions are surfaced (pages this one links to, AND pages that link to
// it) because the corpus links upward richly and laterally almost not at all:
// only 10% of analyte pages linked to any ingredient, though dozens of ingredient
// pages point at each analyte. Sources are excluded , they are the evidence,
// reached through inline citations, not lateral navigation.

export const GROUPS: { key: string; label: string }[] = [
  { key: "analytes", label: "Analytes" },
  { key: "ingredients", label: "Ingredients" },
  { key: "products", label: "Products" },
  { key: "regulations", label: "Regulations" },
  { key: "synthesis", label: "Synthesis" },
  { key: "mitigation", label: "Mitigation" },
]
export const GROUP_KEYS = new Set(GROUPS.map((g) => g.key))

export type RelLink = {
  href: string
  label: string
  cat: string
  outbound: boolean
  // Position in this page's own link order. Document order is a real relevance
  // signal , the first analyte Lead links to is cadmium, the analyte it actually
  // discusses , whereas sorting alphabetically put "Aluminum" at the top of
  // almost every page on the site simply by winning the alphabet.
  order: number
  // False for directory/index pages. Those carry no `type:` frontmatter, which
  // is what separates a topical page from a navigation aid: "Regulations by
  // jurisdiction" is a list, not a connection.
  topical: boolean
}

function categoryOf(slug: string): string {
  return (slug ?? "").split("/")[0]
}

// Frontmatter keys that carry a page's concept identity as STRUCTURED metadata
// rather than as body [[wikilinks]]. Regulation pages declare `analyte: [Cd, Pb]`
// and `matrix: [rice, fish]`; product pages declare `primary_analytes_of_concern`
// and `typical_ingredients`. None of these render as body links, so the raw
// link graph never saw them and the rail's Connections came up empty on 94/155
// regulation pages and half the minor-analyte pages. Resolving them here , analyte
// SYMBOLS to analyte pages, matrix/ingredient/product/regulation TOKENS to the
// page that exists , turns the structured metadata every page already carries
// into real, bidirectional edges without touching a single wiki/ file.
const CONCEPT_KEYS: Record<string, string[]> = {
  analytes: ["analytes", "analyte", "primary_analytes_of_concern", "primary_analytes", "analytes_of_concern", "analyte", "analytes"],
  products: ["products", "product", "related_products"],
  ingredients: ["ingredients", "ingredient", "typical_ingredients", "related_ingredients", "key_ingredients"],
  regulations: ["regulations", "applicable_regulations", "related_regulations"],
  // matrix tokens are food-form slugs; they resolve to whichever of
  // ingredients/ or products/ actually has the page (see resolveConceptToken).
  matrix: ["matrix", "matrices"],
}
const ALL_CONCEPT_KEYS = Object.values(CONCEPT_KEYS).flat()

// Concept index, built once per build from allFiles (same array reference is
// shared across every page render, so this is O(N) overall not O(N^2)). Holds
// the analyte symbol->slug map, the real-slug set for token resolution, and the
// inbound-edge index. Re-keyed if allFiles changes (dev watch).
type ConceptIndex = {
  inbound: Map<string, Set<string>>
  symbolToAnalyte: Map<string, string>
  realSlugs: Set<string>
  // Pages flagged `retired: true` (out-of-reference-scope rows, superseded splits).
  // They stay reachable by direct link but are never surfaced AS a connection ,
  // "Plant Milks, Rice-Based , RETIRED" is not a place to send a reader next.
  retiredSlugs: Set<string>
}
let cachedFiles: unknown = null
let cachedConcept: ConceptIndex | null = null

function buildConceptIndex(allFiles: QuartzComponentProps["allFiles"]): ConceptIndex {
  const realSlugs = new Set<string>()
  const symbolToAnalyte = new Map<string, string>()
  const retiredSlugs = new Set<string>()
  const register = (id: unknown, slug: string) => {
    if (id == null) return
    const s = String(id).trim()
    if (!s) return
    if (!symbolToAnalyte.has(s)) symbolToAnalyte.set(s, slug)
    const low = s.toLowerCase()
    if (!symbolToAnalyte.has(low)) symbolToAnalyte.set(low, slug)
  }
  const analytePages: { simple: string; fm: any }[] = []
  for (const f of allFiles) {
    if (!f.slug) continue
    const simple = simplifySlug(f.slug)
    realSlugs.add(simple)
    const fm = f.frontmatter as any
    if (fm?.retired === true) retiredSlugs.add(simple)
    if (fm?.type === "analyte") analytePages.push({ simple, fm })
  }
  // Canonical `symbol`s FIRST, across all analyte pages, so a page's own symbol
  // always wins. THEN `name` and `species` as fallbacks, so analyte labels that
  // are not the bare symbol still resolve ("Cr-total"/"Chromium" -> chromium,
  // "aluminium" -> aluminum) without a species like MeHg (mercury's) ever
  // shadowing mercury-methyl's symbol claim.
  for (const { simple, fm } of analytePages) register(fm.symbol, simple)
  for (const { simple, fm } of analytePages) {
    register(fm.name, simple)
    for (const sp of Array.isArray(fm.species) ? fm.species : []) register(sp, simple)
  }
  const resolve = (tok: unknown): string | null => resolveConceptToken(tok, realSlugs, symbolToAnalyte)
  const inbound = new Map<string, Set<string>>()
  const add = (target: string, from: string) => {
    if (!inbound.has(target)) inbound.set(target, new Set())
    inbound.get(target)!.add(from)
  }
  for (const f of allFiles) {
    const from = f.slug
    if (!from) continue
    // (1) body [[wikilinks]] , the raw link graph, as before.
    for (const l of f.links ?? []) add(simplifySlug(l as never), from)
    // (2) structured-metadata concept edges, so a regulation's `analyte: [Cd]`
    //     makes it a backlink of analytes/cadmium even with no body link.
    for (const key of ALL_CONCEPT_KEYS) {
      const v = (f.frontmatter as any)?.[key]
      if (v == null) continue
      for (const item of Array.isArray(v) ? v : [v]) {
        const r = resolve(item)
        if (r) add(r, from)
      }
    }
  }
  return { inbound, symbolToAnalyte, realSlugs, retiredSlugs }
}

function conceptIndex(allFiles: QuartzComponentProps["allFiles"]): ConceptIndex {
  if (cachedConcept && cachedFiles === allFiles) return cachedConcept
  cachedConcept = buildConceptIndex(allFiles)
  cachedFiles = allFiles
  return cachedConcept
}

// Resolve one frontmatter token to a real page slug, or null. Order: an
// explicit [[cat/slug]] wikilink, then a analyte symbol (Pb -> analytes/lead), then
// a bare token against the known concept categories. Only ever returns a slug
// that actually exists, so a token with no page produces no phantom edge.
function resolveConceptToken(
  tok: unknown,
  realSlugs: Set<string>,
  symbolToAnalyte: Map<string, string>,
): string | null {
  const raw = String(tok).trim()
  if (!raw) return null
  const wl = raw.match(/\[\[([^\]\|#]+)/)
  if (wl) {
    const s = simplifySlug(wl[1].trim().replace(/^\/+/, "") as never)
    return realSlugs.has(s) ? s : null
  }
  if (symbolToAnalyte.has(raw)) return symbolToAnalyte.get(raw)!
  if (symbolToAnalyte.has(raw.toLowerCase())) return symbolToAnalyte.get(raw.toLowerCase())!
  const bare = simplifySlug(raw.replace(/^\/+/, "") as never)
  if (bare.includes("/")) return realSlugs.has(bare) ? bare : null
  for (const c of ["analytes", "ingredients", "products", "regulations"]) {
    if (realSlugs.has(`${c}/${bare}`)) return `${c}/${bare}`
  }
  return null
}

// Every slug this page's own frontmatter asserts a concept relationship to.
// These are OUTBOUND (the page's own authorship), appended after body links so
// they only ever FILL empty rail slots, never reorder a page that already links
// richly in its prose.
function conceptEdgesOf(
  frontmatter: Record<string, unknown> | undefined,
  ci: ConceptIndex,
): string[] {
  if (!frontmatter) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const key of ALL_CONCEPT_KEYS) {
    const v = (frontmatter as any)[key]
    if (v == null) continue
    for (const item of Array.isArray(v) ? v : [v]) {
      const r = resolveConceptToken(item, ci.realSlugs, ci.symbolToAnalyte)
      if (r && !seen.has(r)) {
        seen.add(r)
        out.push(r)
      }
    }
  }
  return out
}

// Bucketed related links, keyed by concept category, each list sorted by label.
export function relatedByCategory({
  fileData,
  allFiles,
}: Pick<QuartzComponentProps, "fileData" | "allFiles">): Map<string, RelLink[]> {
  const buckets = new Map<string, RelLink[]>()
  const mySlug = fileData.slug
  if (!mySlug) return buckets
  const simple = simplifySlug(mySlug)

  const titleBySlug = new Map<string, string>()
  const slugBySimple = new Map<string, string>()
  const typeBySlug = new Map<string, string>()
  for (const f of allFiles) {
    if (!f.slug) continue
    slugBySimple.set(simplifySlug(f.slug), f.slug)
    const t = f.frontmatter?.title
    if (t) titleBySlug.set(f.slug, String(t))
    const ty = (f.frontmatter as any)?.type
    if (ty) typeBySlug.set(f.slug, String(ty))
  }

  // Direction is tracked, not just membership. A page this one LINKS TO is a
  // connection its own author asserted; a page that merely links here is
  // somebody else's assertion, and on a hub page like a analyte there are
  // hundreds of those. Collapsing both into one undifferentiated set is what
  // put "Beet" and "All-purpose cleaners" in Lead's rail.
  const ci = conceptIndex(allFiles)
  const outbound = new Set<string>()
  const orderOf = new Map<string, number>()
  for (const l of fileData.links ?? []) {
    const sl = simplifySlug(l as never)
    outbound.add(sl)
    if (!orderOf.has(sl)) orderOf.set(sl, orderOf.size)
  }
  // Structured-metadata cross-references: analyte symbols (`analyte: [Cd]`), matrix
  // tokens (`matrix: [rice]`), and curated wikilink arrays alike, resolved to
  // real pages. Appended AFTER body links so they only fill empty rail slots on
  // pages that link sparsely in prose , a page that already links richly keeps
  // its own document order untouched. This is what the older GROUP_KEYS read
  // was reaching for; it only ever fired on values already in [[...]] form,
  // which is why bare `analyte: [Pb]` and `matrix: [rice]` stayed invisible.
  for (const slug of conceptEdgesOf(fileData.frontmatter, ci)) {
    outbound.add(slug)
    if (!orderOf.has(slug)) orderOf.set(slug, orderOf.size)
  }
  const candidates = new Set<string>(outbound)
  for (const from of ci.inbound.get(simple) ?? [])
    candidates.add(simplifySlug(from as never))

  for (const cand of candidates) {
    if (cand === simple) continue
    if (ci.retiredSlugs.has(cand)) continue // never send a reader to a retired page
    const cat = categoryOf(cand)
    if (!GROUP_KEYS.has(cat)) continue // drops sources/, tags/, self-index, etc.
    const realSlug = slugBySimple.get(cand) ?? (cand as string)
    const label = (titleBySlug.get(realSlug) ?? cand.split("/").pop() ?? cand).toString()
    if (!buckets.has(cat)) buckets.set(cat, [])
    buckets
      .get(cat)!
      .push({
        href: resolveRelative(mySlug, realSlug as never),
        label,
        cat,
        outbound: outbound.has(cand),
        order: orderOf.get(cand) ?? Number.MAX_SAFE_INTEGER,
        topical: typeBySlug.has(realSlug),
      })
  }

  // Alphabetical, deliberately. This is the order the in-body "See also" block
  // renders in, and it is a browse aid where alphabetical is the useful order.
  // Relevance ranking belongs to the CONSUMER, not to this shared traversal:
  // the rail sorts its own picks by `order` and filters on `topical`. An
  // earlier version sorted outbound-first here and silently reordered See also
  // on every page as a side effect of a rail change.
  for (const list of buckets.values())
    list.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }))

  return buckets
}
