import { QuartzPluginData } from "../plugins/vfile"

// Which pages ship a downloadable PDF of themselves.
//
// tools/postbuild-synthesis-pdf.mjs renders the Index's own scholarly pages to
// public/<section>/<slug>.pdf. This module is the single place the rendered
// site decides where that file exists, so Head.tsx (citation_pdf_url, which
// Google Scholar follows) and CiteThisPage (the Download PDF link a reader
// clicks) can never point at a PDF the generator did not write. The last time
// these drifted apart, the download affordance 404'd on every page it appeared
// on.
//
// The eligibility rule is mirrored from the generator:
//
//   synthesis/*  every finding , they are article-length by construction
//   metals/*     type: metal, not a declared stub or scaffold, and carrying at
//                least MIN_BODY_SECTIONS non-apparatus headings
//
// The heading count is what does the real work, because most metal pages
// declare no status at all. A page whose only headings are Sources, References
// and Update history is a lede plus apparatus; rendering it under a REFERENCE
// masthead with an abstract and a publication history would claim a technical
// report where none exists.

const THIN_STATUS = new Set(["stub", "scaffold"])
const MIN_BODY_SECTIONS = 3
const APPARATUS = /^(references|sources|update history|peer review state)$/i

function frontmatterString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  const s = String(value).trim()
  return s && s.toLowerCase() !== "null" ? s : undefined
}

// Count the page's substantive headings from the table of contents the TOC
// transformer already built.
//
// Depth cannot be used to skip the H1: the transformer normalises depth against
// the shallowest heading on the page, so H2 is depth 1 on a page that opens
// with its H1 title and depth 0 on a page that does not. Roughly a fifth of the
// metal pages have no H1 (arsenic-total, mercury-methyl), and a depth >= 1 test
// silently scored those zero and withheld a PDF that had been generated. The
// title is therefore matched by text instead, which holds either way , the H1
// on these pages is the frontmatter title verbatim.
function bodySectionCount(fileData: QuartzPluginData): number {
  const toc = fileData.toc ?? []
  const title = String((fileData.frontmatter as Record<string, unknown>)?.title ?? "")
    .trim()
    .toLowerCase()
  return toc.filter((entry) => {
    const text = entry.text.trim()
    if (!text) return false
    if (APPARATUS.test(text)) return false
    if (title && text.toLowerCase() === title) return false // the page's own H1
    return true
  }).length
}

export function hasScholarlyPdf(fileData: QuartzPluginData): boolean {
  const slug = String(fileData.slug ?? "")
  const frontmatter = fileData.frontmatter as Record<string, unknown> | undefined

  const isSynthesis = frontmatter?.type === "synthesis" || slug.startsWith("synthesis/")
  if (isSynthesis) return slug !== "synthesis/index" && slug !== "synthesis"

  const isMetal = frontmatter?.type === "metal" || slug.startsWith("metals/")
  if (!isMetal) return false
  if (slug === "metals/index" || slug === "metals") return false
  if (frontmatter?.type !== "metal") return false

  const status = (frontmatterString(frontmatter?.status) ?? "").toLowerCase()
  if (THIN_STATUS.has(status)) return false

  return bodySectionCount(fileData) >= MIN_BODY_SECTIONS
}
