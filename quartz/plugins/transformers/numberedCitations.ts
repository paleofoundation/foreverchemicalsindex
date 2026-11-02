import { QuartzTransformerPlugin } from "../types"
import { Root, Element, Text, ElementContent } from "hast"

// Server-side rendering of numbered in-text citations for authored review pages
// that carry a numbered `## References` bibliography (as opposed to the
// corpus-emergent synthesis pages, which cite inline via [[sources/…]] wikilinks
// and are handled render-time by quartz/components/scripts/citeSuperscript.inline.ts).
//
// An authored review reproduces its own numbered bibliography (References, items
// 1..N) and cites it in prose with bracketed markers: "…an ecological
// intervention [1, 2].". The marker sits INSIDE the sentence it supports, before
// the terminal period, and never opens a sentence or list item , that placement
// rule is build-enforced by tools/audit-citation-sentence-start.mjs. This
// transformer turns each such marker into a
// superscript link to the matching References entry, and stamps `id="ref-<n>"`
// on each bibliography item so the link resolves. It reuses the existing
// `sup.cite` CSS (proof-design.scss), which renders `<sup class="cite"><a>` as a
// bracketed burgundy superscript , so numbered citations look identical to the
// wikilink ones.
//
// Server-rendered (not a client script) so the citations are in the DOM for
// crawlers and Google Scholar, and are robust to JS timing. Scoped strictly to
// pages that actually cite with bracket markers; a no-op everywhere else (so the
// corpus card References are never re-anchored). The heading is always
// References; "works-cited" is accepted only as a deprecated id alias.
//
// Safety: a marker whose number is outside 1..N (e.g. a stray "[99]" with no
// bibliography item 99) is left as literal text rather than linked to a
// nonexistent row , matching the corpus rule that a citation the list cannot
// resolve is not numbered into a sequence it cannot carry.

const SKIP_TAGS = new Set([
  "a",
  "code",
  "pre",
  "kbd",
  "script",
  "style",
  "sup",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
])

const MARKER = /\[(\d{1,3}(?:\s*,\s*\d{1,3})*)\]/g

const isEl = (n: any, tag?: string): n is Element =>
  n?.type === "element" && (tag === undefined || n.tagName === tag)

// Canonical apparatus heading id is "references" (the house label). "works-cited"
// is accepted only as a deprecated alias so an older page still resolves.
const REFS_HEADING_IDS = new Set(["references", "works-cited"])

// Find the <ol> that follows the References heading (h2#references), id its <li>
// children ref-1..N, and return the count. Parent-aware so it works regardless of
// how deeply the content is wrapped.
function idReferences(node: any): number | null {
  const kids: any[] = node?.children ?? []
  for (let i = 0; i < kids.length; i++) {
    const k = kids[i]
    if (isEl(k, "h2") && REFS_HEADING_IDS.has(String(k.properties?.id ?? ""))) {
      for (let j = i + 1; j < kids.length; j++) {
        const sib = kids[j]
        if (isEl(sib, "ol")) {
          const lis = (sib.children ?? []).filter((c: any) => isEl(c, "li")) as Element[]
          lis.forEach((li, idx) => {
            li.properties = li.properties ?? {}
            ;(li.properties as any).id = `ref-${idx + 1}`
          })
          return lis.length
        }
        if (isEl(sib, "h2")) break // hit the next section before any list
      }
      return 0
    }
    if (isEl(k)) {
      const found = idReferences(k)
      if (found !== null) return found
    }
  }
  return null
}

// Whether the page cites in prose with bracket-number markers ("[6]" / "[1, 2]").
// Corpus-emergent pages cite via [[sources/…]] wikilinks (rendered as source
// links, handled by citeSuperscript.inline.ts) and carry no such markers; gating
// on marker presence keeps this transformer a strict no-op on them, so their
// generated reference cards are never re-anchored or disturbed.
function hasNumberedMarkers(node: any, blocked: boolean): boolean {
  for (const child of node?.children ?? []) {
    if (child.type === "text" && !blocked) {
      MARKER.lastIndex = 0
      if (MARKER.test((child as Text).value)) return true
    } else if (isEl(child)) {
      if (hasNumberedMarkers(child, blocked || SKIP_TAGS.has(child.tagName))) return true
    }
  }
  return false
}

function makeCitation(nums: number[]): Element {
  const children: ElementContent[] = []
  nums.forEach((n, i) => {
    if (i > 0) children.push({ type: "text", value: ", " })
    children.push({
      type: "element",
      tagName: "a",
      properties: { href: `#ref-${n}` },
      children: [{ type: "text", value: String(n) }],
    })
  })
  return { type: "element", tagName: "sup", properties: { className: ["cite"] }, children }
}

function replaceInText(value: string, count: number): ElementContent[] | null {
  MARKER.lastIndex = 0
  const out: ElementContent[] = []
  let last = 0
  let hit = false
  let m: RegExpExecArray | null
  while ((m = MARKER.exec(value))) {
    const nums = m[1].split(",").map((x) => parseInt(x.trim(), 10))
    if (!nums.every((n) => n >= 1 && n <= count)) continue // leave stray/unresolvable markers as text
    hit = true
    if (m.index > last) out.push({ type: "text", value: value.slice(last, m.index) })
    out.push(makeCitation(nums))
    last = m.index + m[0].length
  }
  if (!hit) return null
  if (last < value.length) out.push({ type: "text", value: value.slice(last) })
  return out
}

function walk(node: any, blocked: boolean, count: number): void {
  if (!node.children) return
  const out: ElementContent[] = []
  for (const child of node.children) {
    if (child.type === "text" && !blocked) {
      const replaced = replaceInText((child as Text).value, count)
      out.push(...(replaced ?? [child]))
    } else {
      if (isEl(child)) walk(child, blocked || SKIP_TAGS.has(child.tagName), count)
      out.push(child)
    }
  }
  node.children = out
}

export const NumberedCitations: QuartzTransformerPlugin = () => {
  return {
    name: "NumberedCitations",
    htmlPlugins() {
      return [
        () => (tree: Root) => {
          // Only numbered-citation pages (bracket markers in prose) are touched;
          // corpus [[sources/…]] pages carry no markers and are left untouched so
          // their generated reference cards keep their own anchors.
          if (!hasNumberedMarkers(tree, false)) return
          const count = idReferences(tree)
          if (!count) return // no References list, or it is empty , no-op
          walk(tree, false, count)
        },
      ]
    },
  }
}
