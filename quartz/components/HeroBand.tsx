import { QuartzComponent, QuartzComponentConstructor } from "./types"
import { pathToRoot } from "../util/path"
const HeroBand: QuartzComponent = ({ fileData }) => <section class="fci-hero">
  <a href={`${pathToRoot(fileData.slug!)}/`}>Index</a>
  <h1>{fileData.frontmatter?.title}</h1>
  {fileData.frontmatter?.status === "scaffold" && <p>Evidence review pending</p>}
</section>
export default (() => HeroBand) satisfies QuartzComponentConstructor
