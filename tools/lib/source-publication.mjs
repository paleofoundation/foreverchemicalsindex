// Shared by page filters and public exports. A pending source is a recovery
// record, never public evidence; ingredient destination stubs remain valid.
export function isSourceRecord(frontmatter = {}, slug = "") {
  return frontmatter.type === "source" || Boolean(frontmatter.cite_key) ||
    (/^sources\/[^/]+$/.test(slug) && !/^sources\/(?:index|_TEMPLATE)$/.test(slug))
}

export function isPendingSource(frontmatter = {}) {
  return String(frontmatter.status ?? "").toLowerCase() === "tier1-stub" ||
    String(frontmatter.evidence_tier ?? "").toLowerCase() === "pending"
}

export function isPublicWikiRecord(frontmatter = {}, slug = "") {
  if (frontmatter.draft === true || frontmatter.draft === "true") return false
  return !(isSourceRecord(frontmatter, slug) && isPendingSource(frontmatter))
}

// Bibliographic readiness is separate from scientific evidence fitness. A
// source can report useful summary statistics without sample-level data.
export function citationReviewIssue(frontmatter = {}) {
  if (isPendingSource(frontmatter)) return "Source review pending"
  if (String(frontmatter.status ?? "").toLowerCase() === "duplicate") return "Duplicate record"
  const title = String(frontmatter.title ?? "").trim()
  const authors = Array.isArray(frontmatter.authors) ? frontmatter.authors : [frontmatter.authors]
  if (!title || /^(?:untitled|unknown|pending|tbd)$/i.test(title)) return "Title needs verification"
  if (authors.some((author) => /^(?:unknown\s+authors?|authors?|not\s+(?:mechanically\s+)?resolved|tbd)$/i.test(String(author ?? "").trim()))) {
    return "Author metadata needs verification"
  }
  return null
}
