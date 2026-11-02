import { test } from "node:test"
import assert from "node:assert/strict"
import { isPublicWikiRecord, citationReviewIssue } from "../tools/lib/source-publication.mjs"

test("recovery sources cannot publish through either pending flag", () => {
  assert.equal(isPublicWikiRecord({ type: "source", status: "tier1-stub" }), false)
  assert.equal(isPublicWikiRecord({ type: "source", evidence_tier: "pending" }), false)
  assert.equal(isPublicWikiRecord({ evidence_tier: "pending" }, "sources/malformed"), false)
})

test("a tier label or private routing destination cannot publish", () => {
  assert.equal(isPublicWikiRecord({ type: "source", evidence_tier: "A" }), false)
  assert.equal(isPublicWikiRecord({ type: "ingredient", status: "pending" }, "ingredients/new-food"), false)
  assert.equal(isPublicWikiRecord({ type: "source", draft: "true" }), false)
})
test("catalog pages publish scaffold and evidence records, and pending routes stay private", () => {
  assert.equal(isPublicWikiRecord({ type: "product-category", status: "scaffold" }, "products/eggs-product"), true)
  assert.equal(isPublicWikiRecord({ type: "analyte", status: "evidence" }, "analytes/pfoa"), true)
  assert.equal(isPublicWikiRecord({ type: "analyte-class", status: "scaffold" }, "analytes/pfca"), true)
  assert.equal(isPublicWikiRecord({ type: "aggregate-measure", status: "evidence" }, "analytes/total-organic-fluorine"), true)
  assert.equal(isPublicWikiRecord({ type: "product-category", status: "scaffold", draft: true }, "products/eggs-product"), false)
  assert.equal(isPublicWikiRecord({ type: "ingredient", status: "pending" }, "ingredients/new-food"), false)
})
test("a reviewed bibliography can be public while a failing finding cannot", () => {
  const citation = { type: "source", evidence_tier: "reviewed", review_state: "approved_for_public", title: "Milk survey", authors: ["National Food Agency"], year: 2020, publication: "Journal of Testing", access_url: "https://example.invalid/milk", doi: "10.1000/test.only", findings: [] }
  assert.equal(isPublicWikiRecord(citation, "sources/milk-survey"), true)
  assert.equal(isPublicWikiRecord({ ...citation, findings: [{ value: "1" }] }, "sources/milk-survey"), false)
  assert.equal(isPublicWikiRecord({ ...citation, evidence_tier: "A" }, "sources/milk-survey"), false)
  assert.equal(isPublicWikiRecord({ ...citation, review_state: "machine_extracted" }, "sources/milk-survey"), false)
})
test("bibliographic checks flag explicit placeholders without rejecting summary-only evidence", () => {
  assert.match(citationReviewIssue({ title: "Study", authors: ["Unknown authors"] }), /Author/)
  assert.match(citationReviewIssue({ title: "Study", evidence_tier: "pending" }), /pending/)
  assert.equal(citationReviewIssue({ title: "Milk survey", authors: ["National Food Agency"], sample_n: null, evidence_tier: "A" }), null)
})
