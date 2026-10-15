// Adapted from HMI: all public source records are strict, without warning bypasses.
import { sources, fail } from "./lib/wiki.mjs"
const errors = []
for (const { file, data } of sources()) {
  if (data.draft === true || data.draft === "true") continue
  if (data.review_state !== "approved_for_public") errors.push(`${file}: public review required`)
  if (!data.doi && data.no_doi_assigned !== true) errors.push(`${file}: DOI or no_doi_assigned required`)
  if (data.doi && !/^10\.\d{4,9}\/\S+$/.test(String(data.doi))) errors.push(`${file}: invalid DOI syntax`)
  if (data.doi && data.no_doi_assigned === true) errors.push(`${file}: conflicting DOI declaration`)
  if (!/^https?:\/\//.test(String(data.access_url ?? ""))) errors.push(`${file}: access_url required`)
  for (const field of ["title", "publication", "year"]) if (!data[field]) errors.push(`${file}: ${field} required`)
  if (!Array.isArray(data.authors) || !data.authors.length) errors.push(`${file}: authors required`)
}
fail(errors, "audit-source-dois")
