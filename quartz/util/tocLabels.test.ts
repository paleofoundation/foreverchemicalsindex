import test from "node:test"
import assert from "node:assert/strict"
import { getTocLabel } from "./tocLabels"

test("section labels omit outline numbering without confusing numeric quantities", () => {
  assert.equal(getTocLabel("13. Limitations", "13-limitations"), "Limitations")
  assert.equal(
    getTocLabel("4.2 Iron storage and ferroptosis", "iron"),
    "Iron storage and ferroptosis",
  )
  assert.equal(getTocLabel("10 µg/kg concentration", "concentration"), "10 µg/kg concentration")
})

test("long heading subtitles become compact topic labels", () => {
  const heading =
    "7. Endometriosis: a metal-rich niche and the possibility of microbial amplification"
  assert.equal(getTocLabel(heading, "endometriosis"), "Endometriosis")
  assert.equal(
    getTocLabel(
      "Exposure pathways , evidence across several populations and product forms",
      "exposure",
    ),
    "Exposure pathways",
  )
})

test("long prose headings shorten at word boundaries with a visible omission marker", () => {
  const heading = "Metal exposure is not the same as metal availability"
  assert.equal(getTocLabel(heading, "exposure"), "Metal exposure is not the same as metal…")
  assert.equal(getTocLabel("Evidence summary", "summary"), "Evidence summary")
})

test("editorial labels can use full headings or disambiguating anchor slugs", () => {
  const heading = "2. Metal exposure is not the same as metal availability"
  const labels = {
    [heading]: "Exposure and availability",
    "duplicate-heading-1": "Second study design",
  }
  assert.equal(getTocLabel(heading, "exposure", labels), "Exposure and availability")
  assert.equal(
    getTocLabel("Duplicate heading", "duplicate-heading-1", labels),
    "Second study design",
  )
  assert.equal(getTocLabel("Duplicate heading", "duplicate-heading", labels), "Duplicate heading")
})

test("existing product labels are retained and malformed overrides cannot hide navigation", () => {
  const heading = "Federal / Regulatory Limits vs Field Findings"
  assert.equal(
    getTocLabel(heading, "limits", undefined, "Regulatory comparison"),
    "Regulatory comparison",
  )
  for (const labels of [
    null,
    [],
    { limits: "  " },
    { limits: false },
    { limits: { label: "bad" } },
  ]) {
    assert.equal(getTocLabel("Limitations", "limits", labels), "Limitations")
  }
})
