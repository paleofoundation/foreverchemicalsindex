import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

// Rendered into `.page-header`, which the proof layout hides on every page
// (proof-design.scss: `.proof:not(.proof-home) .proof-main > .page-header` and
// `.proof-home .page-header`). HeroBand owns the one visible, semantic page
// title, so this is a `<p>` rather than a second `<h1>`: a hidden duplicate
// heading is invisible to readers but still splits the title signal for search
// engines and the accessibility tree.
const ArticleTitle: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const title = fileData.frontmatter?.title
  if (title) {
    return <p class={classNames(displayClass, "article-title")}>{title}</p>
  } else {
    return null
  }
}

ArticleTitle.css = `
.article-title {
  margin: 2rem 0 0 0;
}
`

export default (() => ArticleTitle) satisfies QuartzComponentConstructor
