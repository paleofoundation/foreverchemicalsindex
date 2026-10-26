import { QuartzComponent, QuartzComponentConstructor } from "./types"
const ReadingRail: QuartzComponent = () => <section class="fci-reading-rail"><h2>Reading this reference</h2><p>Reviewed evidence and its limitations belong together.</p><a href="/methodology">Evidence methodology →</a><a href="/data">Data and downloads →</a><a href="/errata">Corrections →</a></section>
export default (() => ReadingRail) satisfies QuartzComponentConstructor
