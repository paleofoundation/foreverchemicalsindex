import { QuartzComponent, QuartzComponentConstructor } from "./types"
import { pathToRoot } from "../util/path"
const TopNav: QuartzComponent = ({ cfg, fileData }) => {
  const root = pathToRoot(fileData.slug!)
  return <div class="hmi-topnav"><div class="hmi-topnav-inner">
    <a class="hmi-topnav-brand" href={`${root}/`}>{cfg.pageTitle}</a>
    <nav aria-label="Main navigation" class="fci-navigation">
      {["products", "analytes", "sources", "regulations", "regulators"].map(section =>
        <a key={section} href={`${root}/${section}/`}>{section[0].toUpperCase() + section.slice(1)}</a>)}
    </nav>
  </div></div>
}
export default (() => TopNav) satisfies QuartzComponentConstructor
