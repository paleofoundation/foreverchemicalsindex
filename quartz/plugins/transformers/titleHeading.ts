import { Root } from "mdast"
import { toString } from "mdast-util-to-string"
import { QuartzTransformerPlugin } from "../types"

// Every wiki page opens its markdown body with an `# H1` that repeats the page
// title, and the chrome renders that same title twice more: once in HeroBand
// (`h1.hero-title`, the visible page title) and once in ArticleTitle
// (`p.article-title`, hidden by the proof layout but still in the DOM). The
// result was 2-3 `<h1>` elements per page carrying near-identical text, which
// splits the title signal for search engines and gives screen-reader users
// three competing page headings.
//
// This plugin removes the leading duplicate. It runs on the mdast, before
// TableOfContents and Description, so the TOC, the Snav, and the auto
// description all see the corrected document rather than being patched
// downstream. The previous mitigation was a `display: none` rule in custom.scss
// keyed to a hand-maintained list of slug prefixes: it hid the heading on the
// eleven listed sections, left every other section duplicated, and never fixed
// the DOM-level problem at all.
//
// Only the FIRST block of the document is considered, and only when it is an
// h1. A mid-document h1 is left alone , it is a real section heading, not a
// title echo. Pages whose markdown does not open with an h1 are untouched.
//
// When the page has no `title:` in frontmatter, the heading text is promoted to
// the title instead of being discarded. FrontMatter falls back to `file.stem`,
// which is why /testing and /log rendered "index" and "log" as their headline;
// those pages carry the real title only in the body h1.

export interface Options {
  /** Promote the leading h1's text to the page title when frontmatter has none. */
  promoteToTitle: boolean
}

const defaultOptions: Options = {
  promoteToTitle: true,
}

export const TitleHeading: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }
  return {
    name: "TitleHeading",
    markdownPlugins() {
      return [
        () => {
          return (tree: Root, file) => {
            // remark-frontmatter leaves the frontmatter block in the tree, so
            // skip it before looking for the document's first real block.
            // ("toml" is a valid remark-frontmatter node type that mdast's Root
            // union does not model, hence the widened comparison.)
            const firstIndex = tree.children.findIndex((node) => {
              const type: string = node.type
              return type !== "yaml" && type !== "toml"
            })
            if (firstIndex === -1) return

            const first = tree.children[firstIndex]
            if (first.type !== "heading" || first.depth !== 1) return

            const text = toString(first).trim()
            if (text.length === 0) return

            const frontmatter = file.data.frontmatter
            if (opts.promoteToTitle && frontmatter) {
              // FrontMatter has already defaulted an absent title to file.stem.
              // That default is what produces "index" / "log" headlines, so
              // treat a title equal to the stem as "no title was authored".
              const stem = file.stem ?? ""
              const title = frontmatter.title ?? ""
              if (title === "" || title === stem) {
                frontmatter.title = text
              }
            }

            tree.children.splice(firstIndex, 1)
          }
        },
      ]
    },
  }
}
