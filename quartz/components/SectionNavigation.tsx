import { QuartzComponent, QuartzComponentConstructor } from "./types"
const SectionNavigation: QuartzComponent = ({fileData}) => {
 const sections = (fileData.toc ?? []).filter(item => item.depth <= 2)
 const title = sections.length ? "On this page" : "Reference guide"
 return <details class="fci-section-navigation" open><summary>{title}</summary><nav aria-label={title}>{sections.length ? sections.map(item => <a href={`#${item.slug}`}>{item.text}</a>) : <><a href="#main-content">Read this page</a><a href="/methodology">Methodology</a><a href="/data">Data and downloads</a></>}</nav></details>
}
export default (() => SectionNavigation) satisfies QuartzComponentConstructor
