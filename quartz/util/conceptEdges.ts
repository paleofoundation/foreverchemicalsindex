import { FullSlug, SimpleSlug, simplifySlug } from "./path"

// Shared concept-edge resolver.
//
// Pages in this wiki carry their real lateral relationships as STRUCTURED
// FRONTMATTER, not as prose wikilinks: a regulation declares `metal: [Cd, Pb]`
// (bare analyte symbols), a product declares `panel_metals`/
// `primary_metals_of_concern`, an ingredient's `contamination_profile` is keyed
// by metal symbol, synthesis pages declare `metals`/`ingredients`/`products`
// arrays. Quartz's built-in link graph is populated ONLY from resolved body
// links, so without this resolver the graph and backlinks reflect sparse prose
// links, not the true relationship structure.
//
// This module turns that frontmatter into resolved page-to-page edges. It is the
// SINGLE source of that resolution: the ConceptLinks transformer folds these
// edges into `file.data.links`, which then flows into the content index (Graph),
// the Backlinks component, AND the rail's Connections block (relatedGraph.ts) ,
// so all three surfaces agree rather than diverging.
//
// Sources are deliberately excluded as endpoints (both origin and target),
// mirroring relatedGraph.ts: sources are evidence, reached through inline
// citations, not lateral navigation. Retired redirect stubs are excluded
// downstream by the consumers (they hold the retired flag from `allFiles`).

// The six topical namespaces that form the lateral relationship graph.
export const CONCEPT_NAMESPACES = [
  "metals",
  "ingredients",
  "products",
  "regulations",
  "synthesis",
  "mitigation",
] as const

// lowercased symbol / name / title / bare-slug -> metal page SimpleSlug.
export type MetalIndex = Map<string, SimpleSlug>

export interface MetalPageMeta {
  slug: string
  symbol?: string | null
  name?: string | null
  title?: string | null
}

// Build the metal-symbol index from the metal pages' own frontmatter. `symbol`
// (Pb, tHg, iAs, Cr-VI, ...), `name` (Lead, "Mercury, total"), `title`, and the
// bare page slug ("lead") all resolve to the page. Species arrays are
// deliberately NOT indexed: they collide across pages (tHg's species list
// contains "MeHg", which is mercury-methyl's symbol) and frontmatter edges use
// symbols, not species.
export function buildMetalIndex(metalPages: MetalPageMeta[]): MetalIndex {
  const idx: MetalIndex = new Map()
  const add = (k: unknown, slug: SimpleSlug) => {
    const key = String(k ?? "")
      .trim()
      .toLowerCase()
    // First writer wins so the canonical symbol/name is not clobbered by a
    // later page that happens to reuse the token.
    if (key && !idx.has(key)) idx.set(key, slug)
  }
  for (const p of metalPages) {
    if (!p.slug) continue
    const slug = simplifySlug(p.slug as FullSlug)
    add(p.symbol, slug)
    add(p.name, slug)
    add(p.title, slug)
    add(slug.split("/").pop(), slug) // "metals/lead" -> "lead"
  }
  return idx
}

// A contamination_profile sub-block counts as a real edge only when the cell
// carries evidence. Folding every key (almond declares all ten analytes, most
// with n_studies:0 and null values) would assert that almond is "related to"
// uranium, which is false and would pollute both the graph and backlinks.
function cellHasData(cell: unknown): boolean {
  if (!cell || typeof cell !== "object") return false
  const c = cell as Record<string, unknown>
  if (typeof c.n_studies === "number" && c.n_studies > 0) return true
  if (c.p95_ppb != null) return true
  const t = c.typical_ppb
  if (Array.isArray(t) && t.some((x) => x != null)) return true
  return false
}

function unwrapWikilink(raw: string): string | null {
  const m = raw.match(/\[\[([^\]\|#]+)/)
  return m ? m[1].trim() : null
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : v != null ? [v] : []
}

export interface ResolveCtx {
  metalIndex: MetalIndex
  // Whether a resolved SimpleSlug corresponds to a real published page.
  slugExists: (s: SimpleSlug) => boolean
}

// Resolve every concept edge a page's frontmatter asserts, as validated
// SimpleSlugs. Self-links and sources are dropped; unresolved tokens are dropped
// silently (a false edge is worse than a missing one on a defensibility-grade
// reference).
export function resolveConceptEdges(
  frontmatter: Record<string, unknown> | undefined,
  mySlug: SimpleSlug,
  ctx: ResolveCtx,
): Set<SimpleSlug> {
  const out = new Set<SimpleSlug>()
  if (!frontmatter) return out

  const emit = (candidate: string | null | undefined) => {
    if (!candidate) return
    const cleaned = String(candidate)
      .replace(/^\/+/, "")
      .replace(/[#|].*$/, "")
      .trim()
    if (!cleaned) return
    const simple = simplifySlug(cleaned as FullSlug)
    if (!simple || simple === mySlug) return
    if (simple.startsWith("sources/")) return
    if (!ctx.slugExists(simple)) return
    out.add(simple)
  }

  const emitMetalToken = (tok: unknown) => {
    const raw = String(tok ?? "").trim()
    if (!raw) return
    const inner = unwrapWikilink(raw)
    if (inner) {
      // "[[metals/lead]]" or "[[Lead]]"
      emit(inner)
      const byName = ctx.metalIndex.get(inner.toLowerCase())
      if (byName) emit(byName)
      return
    }
    const slug = ctx.metalIndex.get(raw.toLowerCase())
    if (slug) emit(slug)
  }

  // Topical token: a "[[namespace/slug]]" wikilink, an already-namespaced bare
  // slug ("ingredients/fish"), or a bare slug that belongs to `namespace`
  // ("plant-milks-non-soy-non-rice" under products).
  const emitTopicalToken = (namespace: string, tok: unknown) => {
    const raw = String(tok ?? "").trim()
    if (!raw) return
    const inner = unwrapWikilink(raw)
    if (inner) {
      emit(inner)
      return
    }
    if (raw.includes("/")) {
      emit(raw)
    } else {
      emit(`${namespace}/${raw}`)
    }
  }

  // A loose slug-ish token (matrix / matrices) that may name a product or
  // ingredient page but often names neither; only real pages survive emit().
  const emitLooseToken = (tok: unknown) => {
    const raw = String(tok ?? "").trim()
    if (!raw) return
    const inner = unwrapWikilink(raw)
    if (inner) {
      emit(inner)
      return
    }
    if (raw.includes("/")) {
      emit(raw)
      return
    }
    emit(`products/${raw}`)
    emit(`ingredients/${raw}`)
    emit(raw)
  }

  // Metal symbol / name arrays.
  for (const key of ["metal", "metals", "panel_metals", "primary_metals_of_concern"]) {
    for (const item of asArray(frontmatter[key])) emitMetalToken(item)
  }

  // contamination_profile: object keyed by metal symbol, folded only where the
  // cell carries evidence.
  const cp = frontmatter["contamination_profile"]
  if (cp && typeof cp === "object" && !Array.isArray(cp)) {
    for (const [sym, cell] of Object.entries(cp as Record<string, unknown>)) {
      if (!cellHasData(cell)) continue
      const slug = ctx.metalIndex.get(sym.trim().toLowerCase())
      if (slug) emit(slug)
    }
  }

  // Topical wikilink / slug arrays, keyed by the namespace they resolve into.
  const topicalKeys: Record<string, string> = {
    ingredients: "ingredients",
    products: "products",
    regulations: "regulations",
    synthesis: "synthesis",
    mitigation: "mitigation",
    used_in_products: "products",
  }
  for (const [key, namespace] of Object.entries(topicalKeys)) {
    for (const item of asArray(frontmatter[key])) emitTopicalToken(namespace, item)
  }

  // Matrix tokens (regulation / source formulation scope).
  for (const key of ["matrix", "matrices"]) {
    for (const item of asArray(frontmatter[key])) emitLooseToken(item)
  }

  return out
}

// ---------------------------------------------------------------------------
// Inbound index (backlinks), cached once per allFiles reference so consumers
// (Backlinks) do not pay an O(N^2) scan. Mirrors the private helper in
// relatedGraph.ts; kept here so both the rail and Backlinks can share ONE
// implementation without either editing the other.

type FileLike = { slug?: string; links?: SimpleSlug[] }

let cachedFiles: unknown = null
let cachedIndex: Map<SimpleSlug, Set<SimpleSlug>> | null = null

export function inboundIndex(allFiles: FileLike[]): Map<SimpleSlug, Set<SimpleSlug>> {
  if (cachedIndex && cachedFiles === allFiles) return cachedIndex
  const map = new Map<SimpleSlug, Set<SimpleSlug>>()
  for (const f of allFiles) {
    if (!f.slug) continue
    const from = simplifySlug(f.slug as FullSlug)
    for (const l of f.links ?? []) {
      const target = simplifySlug(l as unknown as FullSlug)
      if (!map.has(target)) map.set(target, new Set())
      map.get(target)!.add(from)
    }
  }
  cachedFiles = allFiles
  cachedIndex = map
  return map
}
