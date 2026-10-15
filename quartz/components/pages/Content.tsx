import { ComponentChildren } from "preact"
import { htmlToJsx } from "../../util/jsx"
import { QuartzComponent, QuartzComponentConstructor } from "../types"
const Content: QuartzComponent = ({ fileData, tree }) => <article class="popover-hint">
  {htmlToJsx(fileData.filePath!, tree) as ComponentChildren}
</article>
export default (() => Content) satisfies QuartzComponentConstructor
