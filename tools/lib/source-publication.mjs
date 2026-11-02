import { evaluateCandidate, findingIssue, profileType, sourceReviewIssue } from "./discovery.mjs"

const publicHubs = new Set(["index", "about", "data", "editorial-standards", "errata", "methodology", "products/index", "analytes/index", "sources/index", "regulations/index", "regulators/index"])
const catalogTypes = new Set(["analyte", "analyte-class", "aggregate-measure", "product-category", "product", "ingredient"])
const catalogStatuses = new Set(["scaffold", "evidence"])
const privateSegment = /(?:^|\/)(?:drafts|private|raw|templates|workbench|batch-reports|lint|queries|briefings)(?:\/|$)/
const truthy = value => value === true || ["true", "yes", "1"].includes(String(value).toLowerCase())
const text = value => typeof value === "string" && value.trim().length > 0
export function isSourceRecord(frontmatter = {}, slug = "") {
  return frontmatter.type === "source" || Boolean(frontmatter.cite_key) || (/^sources\/[^/]+$/.test(slug) && !/^sources\/(?:index|_TEMPLATE)$/.test(slug))
}
export function isPendingSource(frontmatter = {}) {
  return String(frontmatter.status ?? "").toLowerCase() === "tier1-stub" || String(frontmatter.evidence_tier ?? "").toLowerCase() === "pending"
}
// Citations filed as evidence_tier "reviewed" predate the A/B class and review_record
// gate. They can be public bibliography pages. A or B records still need the full
// source review, so a broken strict record cannot publish through this path.
// Structured findings that fail findingIssue stay off the public record.
export function isLegacyReviewedCitation(data = {}) {
  if (["A", "B"].includes(data.evidence_tier)) return false
  if (["pending", "tier1-stub", "duplicate"].includes(String(data.status ?? "").toLowerCase())) return false
  if (String(data.evidence_tier ?? "").toLowerCase() === "pending") return false
  if (String(data.confidence).toUpperCase() === "HOLD") return false
  if (data.review_state !== "approved_for_public") return false
  if (!text(data.title) || !Array.isArray(data.authors) || !data.authors.length || data.authors.some(author => !text(author)) || !data.year || !text(data.publication)) return false
  if (!/^https?:\/\//.test(data.access_url ?? "")) return false
  if ((!/^10\.\d{4,9}\/\S+$/.test(data.doi ?? "") && data.no_doi_assigned !== true) || (data.doi && data.no_doi_assigned === true)) return false
  if ((data.findings ?? []).some(row => findingIssue(row))) return false
  return true
}
export function isPublicWikiRecord(frontmatter = {}, slug = "", context = {}) {
  if (privateSegment.test(slug) || truthy(frontmatter.draft) || truthy(frontmatter.noindex) || truthy(frontmatter.retired) || String(frontmatter.confidence).toUpperCase() === "HOLD") return false
  if (isSourceRecord(frontmatter, slug)) return (!sourceReviewIssue(frontmatter) || isLegacyReviewedCitation(frontmatter)) && !citationReviewIssue(frontmatter)
  if (publicHubs.has(slug)) return frontmatter.type === "reference" || frontmatter.type === "section-index"
  // Catalog pages are the public index. READY remains the structured-findings
  // gate and stays disabled under the proposed discovery policy.
  if (catalogTypes.has(frontmatter.type) && catalogStatuses.has(String(frontmatter.status))) return true
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
