import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import { Root, Element } from "hast"
import { FilePath, FullSlug, slugifyFilePath } from "../../util/path"
import path from "path"
import fs from "fs"
import matter from "gray-matter"

// Build-time: reads every source page's frontmatter once and stamps citation
// metadata (data-authors / data-title / data-journal / data-review-link) onto
// each in-article a[data-slug^="sources/"]. The citeSuperscript inline script
// reads those attributes to build the microbiomemedicine-style hover card ,
// authors + hyperlinked title, then journal/body + a "Read source →" button.
// No content is rewritten; only DOM attributes are added at transform time.
//
// MUST run after CrawlLinks (so data-slug is present); registered immediately
// after Plugin.ResolveLinkTitles() in quartz.config.ts. The map is cached for
// the build lifetime (mirrors linkTitles.ts); a source edited mid-`serve` is
// picked up on restart , acceptable for dev, never affects a prod build.

type Meta = { authors: string; title: string; journal: string; reviewLink: string }
let cache: Map<FullSlug, Meta> | null = null

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : ""
}

// Surname from a single author string (same heuristic as build-source-legend.mjs):
//   "Chung S" / "Chung SR" → "Chung"; "Chung, S." → "Chung"; "Rachel C. Thoerig" → "Thoerig".
function extractSurname(author: string): string {
  const cleaned = str(author)
  if (!cleaned) return ""
  if (cleaned.includes(",")) return cleaned.split(",")[0].trim()
  const tokens = cleaned.split(/\s+/)
  if (tokens.length <= 1) return cleaned
  const last = tokens[tokens.length - 1]
  if (/^[A-Z](\.|[A-Z]\.?){0,2}\.?$/.test(last)) return tokens[0]
  return last
}

// Institutional/agency authors (surname extraction doesn't apply).
const KNOWN_ORG: Record<string, string> = {
  atsdr: "ATSDR", efsa: "EFSA", jecfa: "JECFA", codex: "Codex", fda: "FDA",
  epa: "EPA", usda: "USDA", who: "WHO", cdc: "CDC", oehha: "OEHHA", iarc: "IARC",
  nih: "NIH", eu: "EU", ec: "European Commission", anses: "ANSES", fsanz: "FSANZ",
  fsa: "FSA", cfia: "CFIA", iom: "IOM", hc: "Health Canada",
}
function isInstitutional(name: string): boolean {
  // Keyword match, OR org-name connectives ("Centers FOR Disease Control AND
  // Prevention", "Agency FOR Toxic Substances", "Ministry OF Health") , a single
  // human author element almost never contains " for "/" of "/" and ".
  return (
    /\b(Administration|Commission|Agency|Authority|Department|Ministry|Organization|Organisation|Council|Committee|Service|Centre|Centers?|Institute|Registry|Association|Foundation|Panel|Board|Network|Programme|Program|Prevention|Codex|EFSA|JECFA|WHO|FDA|EPA|USDA|ATSDR|CDC|NIH|IARC|Bureau|Office)\b/i.test(name) ||
    /\s(for|of|and)\s/i.test(name)
  )
}
function orgFromCiteKey(citeKey: string, year: string): string {
  const head = (citeKey.split("-")[0] || "").replace(/\d+$/, "").toLowerCase()
  const disp = KNOWN_ORG[head] || (head ? head.toUpperCase() : "Source")
  return `${disp}${year ? " " + year : ""}`.trim()
}
// Compact "Surname et al. YEAR" for the card header; org label for agency sources.
function authorLabel(authors: unknown, year: unknown, citeKey: string): string {
  const arr: unknown[] = Array.isArray(authors) ? authors : []
  const y = year != null && String(year).trim() ? String(year).trim() : ""
  const first = arr.length ? String(arr[0] ?? "").trim() : ""
  if (first && !isInstitutional(first)) {
    const s = extractSurname(first)
    if (s) return `${s}${arr.length > 1 ? " et al." : ""}${y ? " " + y : ""}`.trim()
  }
  return orgFromCiteKey(citeKey, y)
}

function doiUrl(doi: string): string {
  return doi.startsWith("http://") || doi.startsWith("https://") ? doi : `https://doi.org/${doi}`
}

function readMeta(fullPath: string): Meta | null {
  const raw = fs.readFileSync(fullPath, "utf-8")
  const { data } = matter(raw)
  const d = data as Record<string, unknown>
  if (str(d.type) !== "source") return null
  const citeKey = str(d.cite_key) || path.basename(fullPath, ".md")
  const title = str(d.title)
  const authors = authorLabel(d.authors, d.year, citeKey)
  let journal = str(d.publication)
  if (!journal) {
    const st = str(d.source_type).toLowerCase()
    if (st.includes("gov") || st.includes("regulat")) journal = "Government / regulatory source"
    else if (st) journal = st.charAt(0).toUpperCase() + st.slice(1)
  }
  const doi = str(d.doi)
  const reviewLink = doi ? doiUrl(doi) : str(d.access_url)
  if (!title && !authors) return null
  return { authors, title, journal, reviewLink }
}

function buildMap(directory: string, allFiles: FilePath[]): Map<FullSlug, Meta> {
  const map = new Map<FullSlug, Meta>()
  for (const fp of allFiles) {
    if (!fp.endsWith(".md") || !fp.includes("sources/")) continue
    try {
      const m = readMeta(path.join(directory, fp))
      if (m) map.set(slugifyFilePath(fp), m)
    } catch {
      // unreadable / malformed -> skip; the citation falls back to link text
    }
  }
  return map
}

export const SourceCiteMeta: QuartzTransformerPlugin = () => {
  return {
    name: "SourceCiteMeta",
    htmlPlugins(ctx) {
      return [
        () => {
          return (tree: Root) => {
            if (cache === null) cache = buildMap(ctx.argv.directory, ctx.allFiles)
            const meta = cache
            visit(tree, "element", (node: Element) => {
              if (node.tagName !== "a" || !node.properties) return
              const slug = node.properties["data-slug"]
              if (typeof slug !== "string" || !slug.startsWith("sources/")) return
              const m = meta.get(slug as FullSlug)
              if (!m) return
              if (m.authors) node.properties["data-authors"] = m.authors
              if (m.title) node.properties["data-title"] = m.title
              if (m.journal) node.properties["data-journal"] = m.journal
              if (m.reviewLink) node.properties["data-review-link"] = m.reviewLink
            })
          }
        },
      ]
    },
  }
}
