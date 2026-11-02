import type { Root } from "hast"
import type { QuartzTransformerPlugin } from "../types"
import { presentArticle } from "../../util/publicPresentation"

export const PublicPresentation: QuartzTransformerPlugin = () => ({
  name: "PublicPresentation",
  htmlPlugins() {
    return [() => (tree: Root, file) => {
      const { headings } = presentArticle(tree, file.data.frontmatter ?? {}, String(file.data.slug ?? ""))
      if (file.data.toc) {
        const existing = new Map(file.data.toc.map((entry) => [entry.slug, entry]))
        file.data.toc = headings.flatMap((heading) => {
          const entry = existing.get(heading.id)
          return entry ? [{ ...entry, text: heading.text }] : []
        })
      }
    }]
  },
})
