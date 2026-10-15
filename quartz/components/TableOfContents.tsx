import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import legacyStyle from "./styles/legacyToc.scss"
import modernStyle from "./styles/toc.scss"
import { classNames } from "../util/lang"

// @ts-ignore
import script from "./scripts/toc.inline"
import { i18n } from "../i18n"
import OverflowListFactory from "./OverflowList"
import { concatenateResources } from "../util/resources"
import { getTocLabel } from "../util/tocLabels"

interface Options {
  layout: "modern" | "legacy"
  // "left" places the modern TOC in the left sidebar as the per-page
  // section-nav (DECISIONS: section-nav above the Explorer). It reuses the
  // modern markup/script verbatim , only an extra wrapper class + a left-rail
  // title are added , so the scroll-spy (a[data-for] / .in-view) keeps working.
  position?: "right" | "left"
  // Heading shown above the entries. Defaults to the i18n TOC title; the left
  // section-nav overrides it to "On this page".
  title?: string
}

const defaultOptions: Options = {
  layout: "modern",
  position: "right",
}

// Product-category TOC display map.
//
// The keys are the exact H2 text in the source markdown. The values are the
// labels shown in the right-rail TOC. Any H2 that is NOT in this map will be
// hidden from the TOC, so the map must include every section we want
// navigable. We keep the display labels close to the body H2 text so readers
// are not confused by a TOC that uses different vocabulary than the page.
const productTocLabels = new Map([
  ["Methodology", "Methodology"],
  ["Evidence Summary", "Evidence summary"],
  ["Federal / Regulatory Limits vs Field Findings", "Regulatory comparison"],
  ["Evidence Governance", "Evidence governance"],
  ["Lead Benchmark Context", "Lead benchmark"],
  ["Page Completeness", "Page completeness"],
  ["Scaffold Status", "Page completeness"],
  ["Distribution Context", "Distribution context"],
  ["Measured Values And Concentration Evidence", "Measured values"],
  ["Source Legend", "Source legend"],
  ["Source Evidence Inventory", "Source evidence"],
  ["Extracted Formula Concentration Rows", "Structured values"],
  ["Structured Concentration Rows", "Structured values"],
  ["Broad Product Context , Author-Scope Index", "Broad product context"],
  ["Broad Product Context", "Broad product context"],
  ["Internal Standards Boundary", "Standards boundary"],
  ["Evidence Used For This Row", "Evidence used"],
  ["Exposure Estimates From Formula Consumption", "Exposure context"],
  ["French TDS Category Rows", "Context rows"],
  ["Row Relationship", "Row relationship"],
  ["Why This Category Is High-Risk", "Why this is high-risk"],
  ["What Drives Variance Across Brands", "Variance drivers"],
  ["How The App Would Estimate Risk From An Ingredient List", "Ingredient-list use"],
  ["Historical Recalls/Enforcement", "Regulatory events"],
  ["Sources", "Sources"],
])

let numTocs = 0
export default ((opts?: Partial<Options>) => {
  const layout = opts?.layout ?? defaultOptions.layout
  const position: "left" | "right" = opts?.position ?? defaultOptions.position ?? "right"
  const { OverflowList, overflowListAfterDOMLoaded } = OverflowListFactory()
  const TableOfContents: QuartzComponent = ({
    fileData,
    displayClass,
    cfg,
  }: QuartzComponentProps) => {
    if (!fileData.toc) {
      return null
    }

    const isProductCategory =
      fileData.frontmatter?.type === "product-category" && fileData.slug?.startsWith("products/")
    const tocEntries = (
      isProductCategory
        ? fileData.toc.filter((entry) => entry.depth <= 2 && productTocLabels.has(entry.text))
        : fileData.toc
    ).map((entry) => ({
      ...entry,
      label: isProductCategory ? (productTocLabels.get(entry.text) ?? entry.text) : entry.text,
    }))

    if (tocEntries.length === 0) return null

    // Left section-nav (Examine-style accordion): top-level sections shown,
    // their sub-sections nested and hidden, revealed for the active section via
    // CSS :has(.in-view). Short and curated , no scroll, no OverflowList.
    if (position === "left") {
      // Apparatus sections (Sources / Page history) are reached via the page
      // foot and the utility links, not the section nav , drop them so the nav
      // stays a curated reading map.
      let entries = tocEntries.filter(
        (e) => !/^(sources|references|page history|update history)$/i.test((e.text ?? "").trim()),
      )
      if (entries.length === 0) entries = tocEntries
      const minD = Math.min(...entries.map((e) => e.depth))
      const topCount = entries.filter((e) => e.depth === minD).length
      if (topCount === 1 && entries.length > 1) {
        // Drop the lone leading page-title entry so H2s become the sections.
        entries = entries.filter((e) => e.depth > minD)
      }
      const sectionD = entries.length ? Math.min(...entries.map((e) => e.depth)) : 0
      type SectionEntry = (typeof tocEntries)[number]
      const sections: (SectionEntry & { children: SectionEntry[] })[] = []
      for (const e of entries) {
        const entry = {
          ...e,
          label: getTocLabel(e.text, e.slug, fileData.frontmatter?.toc_labels, e.label),
        }
        if (e.depth === sectionD || sections.length === 0) {
          sections.push({ ...entry, children: [] })
        } else {
          sections[sections.length - 1].children.push(entry)
        }
      }
      const leftTitle = opts?.title ?? "On this page"
      return (
        <nav class={classNames(displayClass, "toc toc-left")} aria-label={leftTitle}>
          <div class="toc-left-title">{leftTitle}</div>
          <ul class="toc-tree">
            {sections.map((s) => (
              <li class={s.children.length ? "toc-section has-sub" : "toc-section"}>
                <a
                  class="toc-section-link"
                  href={`#${s.slug}`}
                  data-for={s.slug}
                  title={s.text}
                  aria-label={s.label === s.text ? undefined : `${s.label}: ${s.text}`}
                >
                  {s.label}
                </a>
                {s.children.length > 0 ? (
                  <ul class="toc-subsections">
                    {s.children.map((c) => (
                      <li>
                        <a
                          href={`#${c.slug}`}
                          data-for={c.slug}
                          title={c.text}
                          aria-label={c.label === c.text ? undefined : `${c.label}: ${c.text}`}
                        >
                          {c.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>
      )
    }

    const id = `toc-${numTocs++}`
    // position is narrowed to "right" here , the "left" path returned above.
    const tocTitle = opts?.title ?? i18n(cfg.locale).components.tableOfContents.title
    return (
      <div class={classNames(displayClass, "toc")}>
        <button
          type="button"
          class={fileData.collapseToc ? "collapsed toc-header" : "toc-header"}
          aria-expanded={!fileData.collapseToc}
        >
          <h3>{tocTitle}</h3>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="fold"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <OverflowList
          id={id}
          class={fileData.collapseToc ? "collapsed toc-content" : "toc-content"}
        >
          {tocEntries.map((tocEntry) => (
            <li key={tocEntry.slug} class={`depth-${tocEntry.depth}`}>
              <a href={`#${tocEntry.slug}`} data-for={tocEntry.slug}>
                {tocEntry.label}
              </a>
            </li>
          ))}
        </OverflowList>
      </div>
    )
  }

  TableOfContents.css = modernStyle
  TableOfContents.afterDOMLoaded = concatenateResources(script, overflowListAfterDOMLoaded)

  const LegacyTableOfContents: QuartzComponent = ({ fileData, cfg }: QuartzComponentProps) => {
    if (!fileData.toc) {
      return null
    }
    const isProductCategory =
      fileData.frontmatter?.type === "product-category" && fileData.slug?.startsWith("products/")
    const tocEntries = isProductCategory
      ? fileData.toc
          .filter((entry) => entry.depth <= 2 && productTocLabels.has(entry.text))
          .map((entry) => ({
            ...entry,
            text: productTocLabels.get(entry.text) ?? entry.text,
          }))
      : fileData.toc

    if (tocEntries.length === 0) return null

    return (
      <details class="toc" open={!fileData.collapseToc}>
        <summary>
          <h3>{i18n(cfg.locale).components.tableOfContents.title}</h3>
        </summary>
        <ul>
          {tocEntries.map((tocEntry) => (
            <li key={tocEntry.slug} class={`depth-${tocEntry.depth}`}>
              <a href={`#${tocEntry.slug}`} data-for={tocEntry.slug}>
                {tocEntry.text}
              </a>
            </li>
          ))}
        </ul>
      </details>
    )
  }
  LegacyTableOfContents.css = legacyStyle

  return layout === "modern" ? TableOfContents : LegacyTableOfContents
}) satisfies QuartzComponentConstructor
