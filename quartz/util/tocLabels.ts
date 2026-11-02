const maxLabelLength = 48

/** Compact navigation text only; callers retain the original heading and anchor. */
export function getTocLabel(
  heading: string,
  slug: string,
  overrides?: unknown,
  preferredLabel = heading,
): string {
  if (overrides && typeof overrides === "object" && !Array.isArray(overrides)) {
    const labels = overrides as Record<string, unknown>
    // Exact headings are convenient to edit; slugs distinguish duplicate headings.
    for (const key of [slug, heading]) {
      const value = Object.hasOwn(labels, key) ? labels[key] : undefined
      if (typeof value === "string" && value.trim()) return value.trim()
    }
  }

  const label = preferredLabel
    .replace(/^(?:\d+[.)]|\d+(?:\.\d+)+\.?)\s+/, "")
    .replace(/\s+/g, " ")
    .trim()
  if (label.length <= maxLabelLength) return label

  // A heading's lead phrase often already names the section ("Introduction: …").
  const lead = label.split(/:\s+|\s+[,–]\s+/)[0].trim()
  if (lead.length >= 8 && lead.length <= maxLabelLength) return lead

  // Unstructured headings remain recognizable; signal omitted words explicitly.
  const prefix = label.slice(0, maxLabelLength - 1)
  const lastSpace = prefix.lastIndexOf(" ")
  const shortened = lastSpace > 0 ? prefix.slice(0, lastSpace) : prefix
  return `${shortened.replace(/[\s,;:,–-]+$/, "")}…`
}
