import { FCI_DISCOVERY_POLICY } from "./discovery-policy.mjs"

const text = value => typeof value === "string" && value.trim().length > 0
export const profileType = type => ({ "product-category": "product", product: "product", ingredient: "ingredient", analyte: "analyte" })[type]

// These checks classify already reviewed records; they never perform review.
export function sourceReviewIssue(data = {}) {
  if (data.draft === true || data.draft === "true") return "draft"
  if (["pending", "tier1-stub", "duplicate"].includes(String(data.status).toLowerCase()) || String(data.evidence_tier).toLowerCase() === "pending") return "pending source"
  if (!["A", "B"].includes(data.evidence_tier)) return "unreviewed evidence class"
  if (String(data.confidence).toUpperCase() === "HOLD") return "HOLD"
  if (data.review_state !== "approved_for_public") return "review not approved"
  if (data.identity_verified !== true || data.provenance_verified !== true || !/^[a-f0-9]{64}$/.test(data.sha256 ?? "")) return "unverified identity or primary artifact"
  if (!text(data.review_record?.id) || data.review_record?.disposition !== "approved_for_public" || data.review_record?.source_sha256 !== data.sha256) return "missing matching review record"
  if (!text(data.title) || !Array.isArray(data.authors) || !data.authors.length || data.authors.some(x => !text(x)) || !data.year || !text(data.publication)) return "incomplete bibliography"
  if (!/^https?:\/\//.test(data.access_url ?? "") || (!/^10\.\d{4,9}\/\S+$/.test(data.doi ?? "") && data.no_doi_assigned !== true) || (data.doi && data.no_doi_assigned === true)) return "unverified citation identity"
  return null
}

export function findingIssue(row = {}) {
  for (const field of ["scope_id", "analyte", "value", "unit", "basis", "source_location", "statistic", "method"]) if (!text(row[field])) return `missing ${field}`
  if (row.evidence_kind !== "occurrence" || row.matrix_fit !== "exact" || row.format_fit !== "exact") return "not exact occurrence"
  if (!["targeted-pfas", "defined-organic-fluorine"].includes(row.measurement_kind)) return "unsupported measurement kind"
  if (row.measurement_kind === "defined-organic-fluorine" && (!["total-organic-fluorine", "extractable-organic-fluorine"].includes(row.analyte) || !text(row.aggregate_definition))) return "undefined or mismatched aggregate"
  if (row.measurement_kind === "targeted-pfas" && /fluorine|^(?:pfca|pfsa|precursors)$/.test(row.analyte)) return "aggregate is not an individual targeted PFAS"
  if (!["quantified", "non-detect"].includes(row.result_status)) return "limit is not occurrence"
  if (row.result_status === "non-detect" && (Number(row.value) === 0 || !text(row.censoring))) return "non-detect is not zero"
  if (row.result_status === "quantified" && /^(?:[<>≤≥]|ND\b|not detected|below\b)/i.test(row.value.trim())) return "censored result is not quantified"
  if (row.derived === true) return "derivation requires separate review"
  if (String(row.confidence).toUpperCase() === "HOLD") return "HOLD finding"
  return null
}

export function evaluateCandidate(candidate = {}, sourceRecords = [], policy = FCI_DISCOVERY_POLICY) {
  const result = (status, reason, families = []) => ({ status, reason, families, policy_version: policy.version })
  if (candidate.draft === true || candidate.draft === "true" || ["pending", "scaffold", "tier1-stub"].includes(candidate.status) || candidate.evidence_tier === "pending" || String(candidate.confidence).toUpperCase() === "HOLD") return result("NEEDS-EVIDENCE", "profile remains draft or held")
  const type = profileType(candidate.type)
  if (!type || candidate.type_verified !== true) return result("REJECT", "unresolved or wrong type")
  if (candidate.alias_of || candidate.overlap_status !== "clear") return result("REJECT", "alias or unresolved overlap")
  if (candidate.identity_verified !== true || !text(candidate.scope_id)) return result("NEEDS-EVIDENCE", "scope identity unverified")
  const families = new Set()
  for (const source of sourceRecords) {
    if (sourceReviewIssue(source) || source.source_type !== "primary_measurement" || !text(source.evidence_family)) continue
    if ((source.findings ?? []).some(row => row.scope_id === candidate.scope_id && row.destination_type === type && !findingIssue(row))) families.add(source.evidence_family)
  }
  const ids = [...families].sort()
  const minimum = policy.minimum_families?.[type]
  if (!Number.isInteger(minimum) || minimum < 1 || ids.length < minimum) return result("NEEDS-EVIDENCE", "insufficient independent exact-scope families", ids)
  if (policy.review_state !== "approved" || policy.profile_publication_enabled !== true) return result("NEEDS-EVIDENCE", "proposed policy; profile publication disabled", ids)
  if (candidate.review_state !== "approved_for_public" || candidate.question_coverage !== "reviewed" || !text(candidate.review_record?.id) || candidate.review_record?.policy_version !== policy.version) return result("NEEDS-EVIDENCE", "profile review incomplete", ids)
  return result("READY", "reviewed policy and exact-scope evidence gates met", ids)
}
