import { QuartzComponent, QuartzComponentConstructor } from "./types"
// @ts-ignore
import script from "./scripts/fci-shell.inline"
export const referenceNavigation = [["Products", "/products"], ["Analytes", "/analytes"], ["Sources", "/sources"], ["Regulations", "/regulations"], ["Regulators", "/regulators"]]
const TopNav: QuartzComponent = ({ cfg }) => <>
  <div class="hmi-topnav fci-topnav"><div class="hmi-topnav-inner">
    <a class="hmi-topnav-brand" href="/" aria-label={`${cfg.pageTitle} home`}>{cfg.pageTitle}</a>
    <button class="fci-menu-toggle" type="button" aria-label="Toggle navigation" aria-controls="fci-primary-navigation" aria-expanded="false" hidden>Menu <span aria-hidden="true">☰</span></button>
    <nav id="fci-primary-navigation" class="fci-navigation" aria-label="Primary">{referenceNavigation.map(([name,href]) => <a href={href}>{name}</a>)}</nav>
    <div class="fci-nav-actions"><button type="button" aria-label="Search the reference" data-search-open aria-haspopup="dialog">Search <span aria-hidden="true">⌕</span></button><a href="/about">About</a></div>
  </div></div>
  <dialog class="fci-search-dialog" id="fci-search-dialog" aria-labelledby="fci-search-title">
    <div class="fci-search-heading"><h2 id="fci-search-title">Search the reference</h2><button type="button" data-search-close aria-label="Close search">Close <span aria-hidden="true">×</span></button></div>
    <label for="fci-search-input">Find a public page</label>
    <input id="fci-search-input" type="search" placeholder="Try methodology, sources, or data" autocomplete="off" />
    <p class="fci-search-status" role="status" aria-live="polite">Scientific profiles are awaiting evidence review.</p>
    <ul class="fci-search-results" aria-label="Search results"></ul>
  </dialog>
</>
TopNav.afterDOMLoaded = script
export default (() => TopNav) satisfies QuartzComponentConstructor
