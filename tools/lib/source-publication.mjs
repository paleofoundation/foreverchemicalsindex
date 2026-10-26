import { evaluateCandidate, profileType, sourceReviewIssue } from "./discovery.mjs"

const publicHubs = new Set(["index", "about", "data", "editorial-standards", "errata", "methodology", "products/index", "analytes/index", "sources/index", "regulations/index", "regulators/index"])
const privateSegment = /(?:^|\/)(?:drafts|private|raw|templates|workbench|batch-reports|lint|queries|briefings)(?:\/|$)/
const truthy = value => value === true || ["true", "yes", "1"].includes(String(value).toLowerCase())
export function isSourceRecord(frontmatter = {}, slug = "") {
  return frontmatter.type === "source" || Boolean(frontmatter.cite_key) || (/^sources\/[^/]+$/.test(slug) && !/^sources\/(?:index|_TEMPLATE)$/.test(slug))
}
export function isPendingSource(frontmatter = {}) {
  return String(frontmatter.status ?? "").toLowerCase() === "tier1-stub" || String(frontmatter.evidence_tier ?? "").toLowerCase() === "pending"
}
export function isPublicWikiRecord(frontmatter = {}, slug = "", context = {}) {
  if (privateSegment.test(slug) || truthy(frontmatter.draft) || truthy(frontmatter.noindex) || truthy(frontmatter.retired) || String(frontmatter.confidence).toUpperCase() === "HOLD") return false
  if (isSourceRecord(frontmatter, slug)) return !sourceReviewIssue(frontmatter) && !citationReviewIssue(frontmatter)
  if (publicHubs.has(slug)) return frontmatter.type === "reference" || frontmatter.type === "section-index"
  if (profileType(frontmatter.type)) return evaluateCandidate(frontmatter, context.sources ?? [], context.policy).status === "READY"
  return false // New page families need an explicit reviewed publication contract.
}
export function citationReviewIssue(frontmatter = {}) {
  if (isPendingSource(frontmatter)) return "Source review pending"
  if (String(frontmatter.status ?? "").toLowerCase() === "duplicate") return "Duplicate record"
  const title = String(frontmatter.title ?? "").trim()
  const authors = Array.isArray(frontmatter.authors) ? frontmatter.authors : [frontmatter.authors]
  if (!title || /^(?:untitled|unknown|pending|tbd)$/i.test(title)) return "Title needs verification"
  if (authors.some(author => !String(author ?? "").trim() || /^(?:unknown\s+authors?|authors?|not\s+(?:mechanically\s+)?resolved|tbd)$/i.test(String(author).trim()))) return "Author metadata needs verification"
  return null
}
