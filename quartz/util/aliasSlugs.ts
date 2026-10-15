import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { FilePath, FullSlug, getFileExtension, slugifyFilePath } from "./path"

// Same alias slug rules as quartz/plugins/transformers/frontmatter.ts.
// Aliases are kept off ctx.allSlugs: that array drives shortest-link
// matching, and a bare alias such as "apple" would make [[apple]] ambiguous.
function aliasToSlug(alias: string): FullSlug {
  const isMd = getFileExtension(alias) === "md"
  const mockFp = (isMd ? alias : `${alias}.md`) as FilePath
  return slugifyFilePath(mockFp)
}

function coerceToArray(input: unknown): string[] {
  if (input === undefined || input === null) return []
  const values = Array.isArray(input)
    ? input
    : input
        .toString()
        .split(",")
        .map((part) => part.trim())
  return values
    .filter((value): value is string | number => typeof value === "string" || typeof value === "number")
    .map((value) => value.toString())
    .filter((value) => value !== "")
}

export function collectAliasSlugs(directory: string, relativePaths: readonly string[]): FullSlug[] {
  const slugs: FullSlug[] = []
  for (const rel of relativePaths) {
    if (!rel.endsWith(".md")) continue
    let data: { aliases?: unknown; alias?: unknown; permalink?: unknown }
    try {
      data = matter(fs.readFileSync(path.join(directory, rel), "utf8")).data
    } catch {
      continue
    }
    const aliases = data.aliases ?? data.alias
    for (const alias of coerceToArray(aliases)) {
      slugs.push(aliasToSlug(alias))
    }
    if (data.permalink != null && data.permalink.toString() !== "") {
      slugs.push(data.permalink.toString() as FullSlug)
    }
  }
  return [...new Set(slugs)]
}
