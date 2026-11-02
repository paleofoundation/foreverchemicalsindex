import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import { Root, Element, Text } from "hast"
import { FilePath, FullSlug, slugifyFilePath } from "../../util/path"
import path from "path"
import fs from "fs"
import matter from "gray-matter"

// Build-time resolver: rewrites the visible text of *aliasless* internal
// wikilinks ([[slug]] with no |alias) to the target page's title, so bare
// wikilinks read as page names rather than raw slugs across the whole site.
//
// Why this exists: Obsidian-flavored `[[slug]]` renders the slug as the link
// text (ofm.ts sets `value: alias ?? fp`), and CrawlLinks' prettyLinks only
// strips the folder , leaving e.g. "fda2025-lead-processed-baby-foods" in
// prose. Authoring a |alias on every wikilink is not maintainable and would
// fight the generators that emit bare wikilinks. This transformer fixes the
// TEXT once at build time (no content rewrite, no client-side flash) for every
// page and every generator at the same time.
//
// Detection is exact, not heuristic: CrawlLinks adds the "alias" class ONLY
// when the author supplied explicit link text (links.ts), so an aliasless
// internal link is class "internal" WITHOUT "alias", and it carries
// data-slug = the resolved FullSlug. We only ever touch those, so existing
// hand-written aliases and generator-supplied aliases are left untouched.
//
// Title source per target, in priority order: frontmatter `title`, else the
// page's first body H1 (many generated pages carry a readable H1 but no
// frontmatter title), else left untouched (keeps the default slug text).
//
// MUST run AFTER CrawlLinks so data-slug and the class list are present; it is
// registered immediately after Plugin.CrawlLinks in quartz.config.ts.

// Cached for the lifetime of the build process. During `serve`, a title added
// or changed after startup will not be picked up until the server restarts;
// that staleness is acceptable for dev and never affects a production build
// (fresh process each time).
let titleCache: Map<FullSlug, string> | null = null

function readTitle(fullPath: string): string {
  const raw = fs.readFileSync(fullPath, "utf-8")
  const { data, content } = matter(raw)
  const fmTitle = (data as { title?: unknown })?.title
  if (typeof fmTitle === "string" && fmTitle.trim()) return fmTitle.trim()
  // fall back to the first ATX H1 in the body
  const h1 = content.match(/^#\s+(.+?)\s*#*\s*$/m)
  if (h1 && h1[1].trim()) return h1[1].trim()
  return ""
}

function buildTitleMap(directory: string, allFiles: FilePath[]): Map<FullSlug, string> {
  const map = new Map<FullSlug, string>()
  for (const fp of allFiles) {
    if (!fp.endsWith(".md")) continue
    try {
      const title = readTitle(path.join(directory, fp))
      if (title) map.set(slugifyFilePath(fp), title)
    } catch {
      // unreadable file / malformed frontmatter -> skip; link keeps default text
    }
  }
  return map
}

export const ResolveLinkTitles: QuartzTransformerPlugin = () => {
  return {
    name: "ResolveLinkTitles",
    htmlPlugins(ctx) {
      return [
        () => {
          return (tree: Root) => {
            if (titleCache === null) {
              titleCache = buildTitleMap(ctx.argv.directory, ctx.allFiles)
            }
            const titles = titleCache
            visit(tree, "element", (node: Element) => {
              if (node.tagName !== "a" || !node.properties) return
              const classes = node.properties.className
              if (!Array.isArray(classes)) return
              if (!classes.includes("internal")) return
              if (
                classes.includes("alias") ||
                classes.includes("broken") ||
                classes.includes("tag-link")
              ) {
                return
              }
              const slug = node.properties["data-slug"]
              if (typeof slug !== "string") return
              const title = titles.get(slug as FullSlug)
              if (!title) return
              // only the default single-text-node [[slug]] shape
              if (node.children.length === 1 && node.children[0].type === "text") {
                ;(node.children[0] as Text).value = title
              }
            })
          }
        },
      ]
    },
  }
}
