// Single source of truth for the left-sidebar (Snav) information architecture ,
// the "rules about where things belong" borrowed from microbiomemedicine.
//
// Keyed by frontmatter `type:`. Each type declares an ordered list of PARENT
// sidebar sections; each parent's children are matched against the page's H2
// heading text by ROLE (regex), so heading drift ("What is lead?" vs "Overview",
// "Microbiome context" vs "Microbiome effects") still maps to the same parent.
// This mirrors the proven role-matcher pattern in
// tools/evidence/lib/ingredient-sections.mjs, and the parent taxonomy is derived
// from the mandatory-sections system + the empirical section-frequency analysis
// (ingredient 8 sections ~89-100%, product 10 sections ~74-81%, regulator 6 at
// 100%). Snav.tsx consumes this; esbuild bundles it into the SSR worker.

export type SectionRule = { id: string; patterns: RegExp[] }

export type ParentRule = {
  id: string
  label: string
  children: SectionRule[]
  // A single promoted section rendered as its own top-level header (no sub-list),
  // e.g. the analyte "Vulnerable Populations" or every flat regulator section.
  direct?: boolean
  // Expanded on load (only "Overview"), giving the parents-only "simplified" view.
  defaultOpen?: boolean
}

export type LabelOverride = { pattern: RegExp; label: (ctx: { pageTitle: string }) => string }

export type TypeModel = {
  type: string
  slugPrefix?: string
  parents: ParentRule[]
  hide: RegExp[]
  labelOverrides?: LabelOverride[]
}

// Apparatus reached via the icon utility footer , hidden from every rail.
const HIDE_BASE: RegExp[] = [/^sources$/i, /^page history$/i, /^status$/i, /further detail/i]

export const CONTENT_MODEL: { types: TypeModel[] } = {
  types: [
    // ---------------------------------------------------------------- METAL
    {
      type: "analyte",
      slugPrefix: "analytes/",
      hide: [...HIDE_BASE, /app-?\s?layer/i, /^planned sections$/i, /^analyte pages$/i],
      labelOverrides: [
        // A bare "Overview" H2 reads as the lede question.
        { pattern: /^overview$/i, label: ({ pageTitle }) => `What is ${pageTitle}?` },
      ],
      parents: [
        {
          id: "overview",
          label: "Overview",
          defaultOpen: true,
          children: [
            { id: "whatis", patterns: [/^what is .+$/i, /^overview$/i] },
            { id: "ataglance", patterns: [/^at a glance$/i] },
            { id: "tox", patterns: [/^toxicology$/i] },
            { id: "routes", patterns: [/exposure routes$/i] },
            { id: "food", patterns: [/^food sources$/i] },
            { id: "reglimits", patterns: [/^regulatory limits$/i] },
            { id: "testing", patterns: [/^testing$/i] },
            { id: "microbiome", patterns: [/^microbiome (context|effects)$/i] },
            { id: "history", patterns: [/^historical context/i] },
          ],
        },
        { id: "vuln", label: "Vulnerable Populations", direct: true, children: [{ id: "vuln", patterns: [/^vulnerable populations$/i] }] },
        { id: "open", label: "Open Questions", direct: true, children: [{ id: "open", patterns: [/^open questions$/i] }] },
        { id: "faq", label: "FAQs", direct: true, children: [{ id: "faq", patterns: [/^(frequently asked questions|faqs?)$/i] }] },
      ],
    },
    // ----------------------------------------------------------- INGREDIENT
    {
      type: "ingredient",
      slugPrefix: "ingredients/",
      hide: [...HIDE_BASE, /^completeness scorecard$/i, /^routing$/i, /fda tds/i, /contamination profile state/i, /^page completeness$/i],
      parents: [
        {
          id: "overview",
          label: "Overview",
          defaultOpen: true,
          children: [
            { id: "why", patterns: [/why .*accumulat/i] },
            { id: "profile", patterns: [/contamination profile/i, /heavy analyte contamination/i] },
          ],
        },
        {
          id: "contamination",
          label: "Contamination detail",
          children: [
            { id: "ranges", patterns: [/^ranges by/i] },
            { id: "processing", patterns: [/processing effects/i] },
            { id: "derivative", patterns: [/derivative risk/i] },
          ],
        },
        {
          id: "mitigation",
          label: "Mitigation",
          children: [
            { id: "options", patterns: [/^mitigation/i] },
            { id: "reglimits", patterns: [/regulatory limits/i] },
          ],
        },
      ],
    },
    // ------------------------------------------------------ PRODUCT-CATEGORY
    {
      type: "product-category",
      slugPrefix: "products/",
      hide: [...HIDE_BASE, /scaffold status/i, /evidence governance/i],
      parents: [
        {
          id: "overview",
          label: "Overview",
          defaultOpen: true,
          children: [
            { id: "audience", patterns: [/who this page is for/i] },
            { id: "scope", patterns: [/literature scope/i] },
            { id: "method", patterns: [/^methodology$/i] },
          ],
        },
        {
          id: "evidence",
          label: "Evidence",
          children: [
            // v3 subcategory screen leads Evidence with the ingredient-driver
            // cards (artifact 1462); the source-backed detail nests under it.
            { id: "drivers", patterns: [/^ingredient drivers$/i] },
            { id: "litsummary", patterns: [/literature evidence summary/i] },
            { id: "inventory", patterns: [/source evidence inventory/i] },
            { id: "broad", patterns: [/broad product context/i] },
          ],
        },
        {
          id: "limits",
          label: "Limits",
          children: [
            // v3 "Limits applicable to this category" (artifact 1478) + its
            // "Testing and verification posture" sub (artifact 1501), then the
            // legacy field-findings crosswalk and standards-math detail.
            { id: "applicable", patterns: [/^limits applicable to this category$/i] },
            { id: "testing", patterns: [/testing and verification posture/i] },
            { id: "crosswalk", patterns: [/limits vs field findings/i] },
            { id: "levers", patterns: [/levers to reduce/i] },
            { id: "math", patterns: [/how standards math/i] },
          ],
        },
        { id: "enforcement", label: "Enforcement", children: [{ id: "recalls", patterns: [/recall/i, /enforcement/i] }] },
      ],
    },
    // ----------------------------------------------- REGULATOR (flat, no nesting)
    {
      type: "regulator",
      slugPrefix: "regulators/",
      hide: [...HIDE_BASE, /^references$/i],
      parents: [
        { id: "quickread", label: "Quick read", direct: true, children: [{ id: "quickread", patterns: [/quick read/i] }] },
        { id: "mandate", label: "Mandate & scope", direct: true, children: [{ id: "mandate", patterns: [/mandate/i] }] },
        { id: "positions", label: "Positions across analytes", direct: true, children: [{ id: "positions", patterns: [/positions across analytes/i] }] },
        { id: "diverges", label: "Where it diverges", direct: true, children: [{ id: "diverges", patterns: [/where it diverges/i, /diverge/i] }] },
        { id: "updatelog", label: "Update log", direct: true, children: [{ id: "updatelog", patterns: [/update log/i] }] },
        { id: "keydocs", label: "Key documents", direct: true, children: [{ id: "keydocs", patterns: [/key documents/i] }] },
      ],
    },
    // ------------------------------------------------ MITIGATION (index)
    // One "Overview" parent: the intro is the parent target, and the directory's
    // orientation sections collapse underneath it (hidden until the toggle opens).
    {
      type: "mitigation-index",
      slugPrefix: "mitigation/",
      hide: [...HIDE_BASE],
      parents: [
        {
          id: "overview",
          label: "Overview",
          children: [
            { id: "overview", patterns: [/^overview$/i] },
            { id: "taxonomy", patterns: [/^taxonomy$/i] },
            { id: "why", patterns: [/why .*matter/i] },
            { id: "current", patterns: [/current state/i] },
            { id: "xref", patterns: [/^cross-?references$/i] },
          ],
        },
      ],
    },
    // ------------------------------------------------ SYNTHESIS (index)
    // Same shape: Overview parent, with the index's own orientation sections
    // (findings table, promotion criteria, cadmium note) collapsed underneath.
    {
      type: "synthesis-index",
      slugPrefix: "synthesis",
      hide: [...HIDE_BASE],
      parents: [
        {
          id: "overview",
          label: "Overview",
          children: [
            { id: "overview", patterns: [/^overview$/i] },
            { id: "findings", patterns: [/synthesis findings pages/i] },
            { id: "promote", patterns: [/when to promote/i] },
            { id: "cadmium", patterns: [/cadmium synthesis/i] },
          ],
        },
      ],
    },
  ],
}

// Resolve the model for a page. Returns undefined when the type is unknown or the
// slug guard fails , Snav then falls back to its generic heading-derived rail.
export function modelForType(type: string | undefined, slug: string): TypeModel | undefined {
  if (!type) return undefined
  const m = CONTENT_MODEL.types.find((t) => t.type === type)
  if (!m) return undefined
  if (m.slugPrefix && !slug.startsWith(m.slugPrefix)) return undefined
  return m
}
