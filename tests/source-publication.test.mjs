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
test("bibliographic checks flag explicit placeholders without rejecting summary-only evidence", () => {
  assert.match(citationReviewIssue({ title: "Study", authors: ["Unknown authors"] }), /Author/)
  assert.match(citationReviewIssue({ title: "Study", evidence_tier: "pending" }), /pending/)
  assert.equal(citationReviewIssue({ title: "Milk survey", authors: ["National Food Agency"], sample_n: null, evidence_tier: "A" }), null)
})
