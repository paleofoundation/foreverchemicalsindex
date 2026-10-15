import { remark } from "remark"
import { toString } from "mdast-util-to-string"

export interface ShareInput {
  frontmatter?: Record<string, unknown>
  slug?: string
  description?: string
  canonicalUrl: string
}

export interface ShareContent {
  text: string
  hashtags: string[]
  post: string
  xUrl: string
}

const markdown = remark()
const sentences = new Intl.Segmenter("en", { granularity: "sentence" })
const graphemes = new Intl.Segmenter("en", { granularity: "grapheme" })

/** Share copy is rendered prose, never Markdown syntax or HTML markup. */
function prose(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return ""
  const source = value
    .replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, "$2")
    .replace(
      /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
      (_, target: string, label?: string) => label ?? target.split("/").at(-1)!.replace(/-/g, " "),
    )
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/(?:p|div|li|h[1-6])\s*>|<br\s*\/?\s*>/gi, " ")
    .replace(/<\/?[a-z][\w:-]*(?:\s[^<>]*?)?\s*\/?>/gi, "")
  return markdown
    .parse(source)
    .children.map((node) => toString(node, { includeHtml: false }))
    .join(" ")
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim()
}

// Be conservative about bare domains too: X can turn x.co into a 23-character URL.
// False positives only reduce the text budget; no URL is shortened in the copy.
const urlLike =
  /(?:https?:\/\/|www\.)[^\s<>"']+|(?:[\p{L}\p{N}_-]+\.)+[\p{L}][\p{L}\p{N}-]+(?:[/:?#][^\s<>"']*)?/giu

function characterWeight(value: string): number {
  return Array.from(value).reduce(
    (length, character) => length + (character.codePointAt(0)! <= 0x7f ? 1 : 2),
    0,
  )
}

// This intentionally overestimates X's weighting for many Unicode characters.
// Counting code points (not UTF-16 units) and NFC avoids splitting surrogate pairs.
function weight(value: string): number {
  const normalized = value.normalize("NFC")
  let total = characterWeight(normalized)
  for (const [url] of normalized.matchAll(urlLike)) {
    total += Math.max(0, 23 - characterWeight(url))
  }
  return total
}

function normalizeHashtags(values: unknown[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    if (typeof value !== "string") continue
    const tag = value.normalize("NFC").replace(/[^\p{L}\p{N}_]/gu, "")
    const key = tag.toLowerCase()
    if (!/\p{L}/u.test(tag) || seen.has(key)) continue
    seen.add(key)
    result.push(tag)
    if (result.length === 3) break
  }
  return result
}

const metalTags: Record<string, string> = Object.create(null)
for (const [symbol, name] of [
  ["Al", "Aluminum"],
  ["Sb", "Antimony"],
  ["As", "Arsenic"],
  ["Ba", "Barium"],
  ["Be", "Beryllium"],
  ["Cd", "Cadmium"],
  ["Cs", "Cesium"],
  ["Cr", "Chromium"],
  ["Co", "Cobalt"],
  ["Cu", "Copper"],
  ["Au", "Gold"],
  ["Fe", "Iron"],
  ["Pb", "Lead"],
  ["Li", "Lithium"],
  ["Mg", "Magnesium"],
  ["Mn", "Manganese"],
  ["Hg", "Mercury"],
  ["Mo", "Molybdenum"],
  ["Ni", "Nickel"],
  ["Pd", "Palladium"],
  ["Pt", "Platinum"],
  ["Ag", "Silver"],
  ["Te", "Tellurium"],
  ["Tl", "Thallium"],
  ["Sn", "Tin"],
  ["Ti", "Titanium"],
  ["U", "Uranium"],
  ["V", "Vanadium"],
  ["Zn", "Zinc"],
]) {
  metalTags[symbol.toLowerCase()] = name
  metalTags[name.toLowerCase()] = name
}

function hashtagsFor(frontmatter: Record<string, unknown>, slug: string): string[] {
  if (Array.isArray(frontmatter.shareHashtags)) {
    // An explicit empty array is the editorial opt-out.
    return normalizeHashtags(frontmatter.shareHashtags)
  }
  if (typeof frontmatter.shareHashtags === "string") {
    return normalizeHashtags(frontmatter.shareHashtags.split(/[,\s]+/))
  }

  const family = slug.replace(/^\/+/, "").split("/")[0].toLowerCase()
  const type = prose(frontmatter.type).toLowerCase()
  const tags = Array.isArray(frontmatter.tags)
    ? frontmatter.tags.join(" ")
    : prose(frontmatter.tags)
  const topic = `${prose(frontmatter.title)} ${tags} ${type}`
  if (family === "microbiome" || /\bmicrobiome\b|\bmicrobial\b/i.test(topic)) {
    return ["Microbiome", "HeavyMetals"]
  }
  if (family === "metals" || type === "metal") {
    for (const candidate of [
      frontmatter.symbol,
      frontmatter.name,
      frontmatter.title,
      slug.split("/").at(-1),
    ]) {
      const name = metalTags[prose(candidate).toLowerCase()]
      if (name) return [name, "HeavyMetals"]
    }
  }
  if (family === "ingredients" || type === "ingredient") {
    return ["FoodSafety", "HeavyMetals"]
  }
  if (family === "products" || /^(product|product-category)$/.test(type)) {
    return ["ProductSafety", "HeavyMetals"]
  }
  if (["regulations", "regulators"].includes(family) || /^(regulation|regulator)$/.test(type)) {
    return ["Regulation", "HeavyMetals"]
  }
  if (family === "testing" || type === "testing") return ["AnalyticalChemistry", "HeavyMetals"]
  return ["HeavyMetals"]
}

function openingSentences(value: string, budget: number): string {
  let result = ""
  const urls = Array.from(value.matchAll(urlLike), (match) => ({
    start: match.index,
    end: match.index + match[0].length,
  }))
  for (const { segment, index } of sentences.segment(value)) {
    const end = index + segment.trimEnd().length
    // Sentence segmentation can mistake a Unicode domain's dot for punctuation.
    if (urls.some((url) => end > url.start && end < url.end)) continue
    const candidate = value.slice(0, end).trim()
    // An unfinished opening clause is not a usable scientific summary.
    if (!/[.!?。！？]["'”’\])]*$/.test(candidate)) break
    if (weight(candidate) > budget) break
    result = candidate
  }
  return result
}

function fittingTitle(title: string, budget: number): string {
  if (weight(title) <= budget) return title
  let prefix = ""
  for (const { segment } of graphemes.segment(title)) {
    if (weight(prefix + segment + "…") > budget) break
    prefix += segment
  }
  const lastSpace = prefix.lastIndexOf(" ")
  if (lastSpace > 0) prefix = prefix.slice(0, lastSpace)
  return `${prefix.trimEnd()}…`
}

/** One build-time payload shared by X, native sharing, and copy-post controls. */
export function getShareContent({
  frontmatter = {},
  slug = "unknown page",
  description,
  canonicalUrl,
}: ShareInput): ShareContent {
  const hashtags = hashtagsFor(frontmatter, slug)
  const hashtagText = hashtags.map((tag) => `#${tag}`).join(" ")
  // X counts the canonical URL as 23 characters; newlines have the same cost as spaces.
  const budget = 280 - 23 - 1 - (hashtagText ? weight(hashtagText) + 1 : 0)
  if (budget < 2) {
    throw new Error(
      `Share content for "${slug}": shareHashtags leave no room for text. Shorten the tags.`,
    )
  }

  const authored = prose(frontmatter.shareText)
  let text: string
  if (authored) {
    if (weight(authored) > budget) {
      throw new Error(
        `Share content for "${slug}": shareText exceeds the X text budget (${weight(authored)}/${budget} weighted characters after URL and hashtags). Shorten shareText while preserving its scientific qualifications; it will not be truncated.`,
      )
    }
    text = authored
  } else {
    const fallback =
      [frontmatter.socialDescription, frontmatter.description, frontmatter.dek, description]
        .map(prose)
        .map((value) =>
          value.replace(/^(?:Quick read|Overview|Abstract)(?:\s*[:,–-]\s*|\s+(?=[A-Z]))/, ""),
        )
        .find(Boolean) ?? ""
    const title = prose(frontmatter.title) || "Forever Chemicals Index"
    text =
      fallback && weight(fallback) <= budget
        ? fallback
        : openingSentences(fallback, budget) || fittingTitle(title, budget)
  }

  const params = new URLSearchParams({ text, url: canonicalUrl })
  if (hashtags.length) params.set("hashtags", hashtags.join(","))
  return {
    text,
    hashtags,
    post: [text, canonicalUrl, hashtagText].filter(Boolean).join("\n"),
    xUrl: `https://twitter.com/intent/tweet?${params.toString()}`,
  }
}
