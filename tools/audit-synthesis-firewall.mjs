// Adapted from HMI: inspect all wiki text, including metadata and generated blocks.
import { pages, fail } from "./lib/wiki.mjs"
import fs from "node:fs"
const errors = []
const forbidden = [
  [/\u2014/u, "forbidden punctuation"],
  [new RegExp("part" + "ner", "i"), "prohibited terminology"],
  [/foreverchemicalstested|microplasticstested|heavymetal(?:certified|tested)/i, "certification promotion"],
  [/HMT&?C\b/i, "legacy program text"],
  [/\bGenX\b/i, "commercial analyte label"],
  [/certification implication|certify your|apply for certification|every (?:lot|batch)/i, "promotional claim"],
]
for (const page of pages()) {
  const text = fs.readFileSync(page.file,"utf8")
  for (const [pattern,label] of forbidden) if (pattern.test(text)) errors.push(`${page.file}: ${label}`)
}
fail(errors, "audit-synthesis-firewall")
