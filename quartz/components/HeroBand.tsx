import { QuartzComponent, QuartzComponentConstructor } from "./types"
const HeroBand: QuartzComponent = ({ fileData }) => {
  const data = fileData.frontmatter
  const label = data?.type === "source" ? "Source record" : data?.type === "section-index" ? "Reference directory" : data?.type === "product-category" ? "Product category" : data?.type === "analyte" ? "Analyte" : "Reference"
  return <section class="hero-band fci-masthead" aria-label="Page introduction">
    <div class="hero-grid"><div class="hero-main">
      <nav class="hero-crumb" aria-label="Breadcrumb"><a href="/">Index</a><span aria-hidden="true">/</span><span>{data?.title}</span><span class="hero-kind">{label}</span></nav>
      <h1 class="hero-title">{data?.title}</h1>
      <p class="hero-dek">{data?.qa_fixture ? "TEST ONLY. Synthetic layout fixture. No scientific finding or review approval is represented." : data?.type === "section-index" ? "Pages list what this index has on file. An empty section is a gap, not a finding that a chemical is absent." : typeof data?.dek === "string" ? data.dek : "Quoted values stay tied to the cited study. Empty sections are gaps."}</p>
      <div class="hero-acts"><a class="hero-act" href="#main-content">Read this page</a><a class="hero-act" href="/methodology">Evidence policy</a></div>
    </div><aside class="hero-sidebar" aria-label="Reference scope"><p class="fci-eyebrow">Public reference</p><p class="fci-scope-name">Forever Chemicals Index</p><div class="hero-snapshot"><div class="hero-snapshot-head">Reading this reference</div><p>Quoted values stay tied to the cited page. The findings download includes only rows that pass the structured review gate.</p><a href="/data">View the evidence data →</a></div></aside></div>
  </section>
}
export default (() => HeroBand) satisfies QuartzComponentConstructor
