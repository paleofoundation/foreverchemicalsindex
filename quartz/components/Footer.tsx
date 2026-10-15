import { QuartzComponent, QuartzComponentConstructor } from "./types"
import { pathToRoot } from "../util/path"
const Footer: QuartzComponent = ({ cfg, fileData }) => <footer class="fci-footer">
  <strong>{cfg.pageTitle}</strong>
  <nav aria-label="Reference policies">{["about", "methodology", "editorial-standards", "data", "errata"].map(page =>
    <a key={page} href={`${pathToRoot(fileData.slug!)}/${page}`}>{page.replaceAll("-", " ")}</a>)}</nav>
  <a href="https://contaminantstandards.com">Institute of Contaminant Standards</a>
</footer>
export default (() => Footer) satisfies QuartzComponentConstructor
