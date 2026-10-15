import test from "node:test"
import assert from "node:assert/strict"
import { isAskEligible } from "./contentIndex"

test("Ask emitter includes public evidence families and excludes pending/private material", () => {
  for (const slug of ["ingredients/olive-oil", "synthesis/new-topic", "regulators/new-agency"]) {
    assert.equal(isAskEligible(slug, {}), true)
  }
  for (const field of ["noindex", "draft", "retired"]) {
    for (const value of [true, "true", "yes", "1"]) {
      assert.equal(isAskEligible("ingredients/olive-oil", { [field]: value }), false)
    }
  }
  assert.equal(isAskEligible("sources/pending", { evidence_tier: "pending" }), false)
  assert.equal(isAskEligible("sources/tier1", { status: "tier1-stub" }), false)
  for (const slug of ["log", "queries/a", "workbench/a", "batch-reports/a", "certification/a"]) {
    assert.equal(isAskEligible(slug, {}), false)
  }
})
