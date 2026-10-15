// Adds superscript citations to source links without removing narrative words:
// "Moon et al. found…" → "Moon et al.[1] found…". Only citation-only parentheses
// after prose compact to numbers: "…claim (cite)." → "…claim.[1]".
// Render-time only; authored content is untouched.
const SOURCE_LINK = 'a[data-slug^="sources/"]'

// Decide before replacing any links, so a multi-source group is classified as
// a whole. When markup is ambiguous, retain the author's words. A source label
// may be a sentence's subject or object, not disposable citation apparatus.
function compactCitationLinks(
  links: HTMLAnchorElement[],
): Set<HTMLAnchorElement> {
  const compact = new Set<HTMLAnchorElement>()
  const eligible = new Set(links)
  for (const first of links) {
    if (compact.has(first)) continue
    const before = first.previousSibling
    if (
      before?.nodeType !== Node.TEXT_NODE ||
      !/\(\s*$/.test(before.textContent || "")
    )
      continue

    const group = [first]
    let end: HTMLAnchorElement = first
    while (end.nextSibling?.nodeType === Node.TEXT_NODE) {
      const separator = end.nextSibling
      const next = separator.nextSibling
      if (
        !/^[\s,;]+$/.test(separator.textContent || "") ||
        !(next instanceof HTMLAnchorElement) ||
        !eligible.has(next)
      )
        break
      group.push(next)
      end = next
    }
    const after = end.nextSibling
    if (
      after?.nodeType !== Node.TEXT_NODE ||
      !/^\s*\)/.test(after.textContent || "")
    )
      continue

    const block = first.closest("p, li, dd, dt, blockquote")
    if (!block) continue
    const range = document.createRange()
    range.selectNodeContents(block)
    range.setEndBefore(first)
    const preceding = range
      .toString()
      .replace(/\(\s*$/, "")
      .trim()
    // A leading parenthetical still needs words; after a sentence boundary we
    // conservatively retain its label as well instead of creating a bare number.
    if (!/[\p{L}\p{N}]/u.test(preceding) || /[.!?][\s"'”’]*$/.test(preceding))
      continue
    group.forEach((link) => compact.add(link))
  }
  return compact
}

function applyCiteSuperscripts() {
  const content = document.querySelector(".wiki-content")
  if (!content) return
  // Landing surfaces carry no citation apparatus; their links to /sources are
  // navigation, not citations. Without this the homepage feature-card "Sources"
  // link is eaten and rendered as a bare "[1]".
  if ((document.body.dataset.slug ?? "") === "index") return

  // The trailing apparatus , Works cited, Anchor sources, References, Sources,
  // Update history , is not prose. Authored bibliographies must keep their full
  // linked titles, just like generated reference lists and source inventories.
  // Its source links are the reference list and the corpus table, not citations,
  // and must be left alone. They were meant to be excluded by
  // a.closest("#references, #sources, ...") , but those ids sit on the HEADINGS,
  // and the lists are SIBLINGS of the headings, not descendants, so closest()
  // never matched and every reference entry's own source link was being
  // converted into a stray trailing superscript. Exclude by DOCUMENT POSITION
  // instead: find the first apparatus heading and skip any citation at or after
  // it. This also lets the reference list make the title itself the source link
  // without the script eating it.
  const apparatus = Array.from(
    content.querySelectorAll(
      "h2#works-cited, h2#bibliography, h2[id^='anchor-sources'], h2#references, " +
        "h2#sources, h2#source-inventory, h2#source-evidence-inventory, " +
        "h2[id='update-history'], h2[id='page-history']",
    ),
  ).sort((a, b) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  )[0]

  // 1) Convert each source link to a superscript citation.
  const links = Array.from(
    content.querySelectorAll<HTMLAnchorElement>(SOURCE_LINK),
  ).filter((a) => {
    if (a.closest("sup.cite, table, h1, h2, h3, h4, h5, h6, nav, pre, code"))
      return false
    return !(
      apparatus &&
      apparatus.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING
    )
  })
  const compact = compactCitationLinks(links)
  const compactSups: HTMLElement[] = []
  const numBySlug = new Map<string, number>()
  let n = 0
  links.forEach((el) => {
    const a = el as HTMLAnchorElement
    const slug = a.getAttribute("data-slug") || ""
    let num = numBySlug.get(slug)
    if (num === undefined) {
      num = ++n
      numBySlug.set(slug, num)
    }
    const href = a.getAttribute("href") || "#"
    const orig = (a.textContent || "").trim()
    // Metadata stamped at build time by the SourceCiteMeta transformer.
    const dAuthors = (a.getAttribute("data-authors") || "").trim()
    const dTitle = (a.getAttribute("data-title") || "").trim()
    const dJournal = (a.getAttribute("data-journal") || "").trim()
    const dReview = (a.getAttribute("data-review-link") || "").trim()

    const sup = document.createElement("sup")
    sup.className = "cite"
    const link = document.createElement("a")
    link.href = href
    link.textContent = String(num)
    const card = document.createElement("span")
    card.className = "cite-card"

    if (dTitle || dAuthors) {
      // microbiomemedicine-style card: tinted header (authors + hyperlinked
      // title), then journal/body + a "Read source →" button.
      const head = document.createElement("span")
      head.className = "cite-card-head"
      if (dAuthors) {
        const au = document.createElement("span")
        au.className = "cite-card-authors"
        au.textContent = dAuthors
        head.appendChild(au)
      }
      const titleEl = document.createElement("a")
      titleEl.className = "cite-card-title"
      titleEl.href = href
      titleEl.textContent = dTitle || orig
      head.appendChild(titleEl)
      card.appendChild(head)

      const body = document.createElement("span")
      body.className = "cite-card-body"
      if (dJournal) {
        const j = document.createElement("span")
        j.className = "cite-card-journal"
        j.textContent = dJournal
        body.appendChild(j)
      }
      const review = document.createElement("a")
      review.className = "cite-card-review"
      review.href = dReview || href
      if (dReview) {
        review.target = "_blank"
        review.rel = "noopener"
      }
      review.textContent = "Read source →"
      body.appendChild(review)
      card.appendChild(body)
    } else {
      // Fallback (no stamped metadata): link text + "View source".
      const au = document.createElement("span")
      au.className = "au"
      au.textContent = orig
      const go = document.createElement("a")
      go.className = "go"
      go.href = href
      go.textContent = "View source →"
      card.appendChild(au)
      card.appendChild(go)
    }
    sup.appendChild(link)
    sup.appendChild(card)
    if (compact.has(a)) {
      a.replaceWith(sup)
      compactSups.push(sup)
    } else {
      // Move the actual children, preserving emphasis and other inline markup.
      // The adjacent number remains the clickable citation with its hover card.
      a.replaceWith(...Array.from(a.childNodes), sup)
    }
  })

  // 2) Strip parentheses that wrap ONLY a citation (or comma-separated run).
  const sups = compactSups
  const seen = new Set<Node>()
  sups.forEach((sup) => {
    if (seen.has(sup)) return
    // Extend the run over comma / semicolon / space separators.
    let end: Element = sup
    let node = sup.nextSibling
    while (node) {
      if (node.nodeType === 3 && /^[\s,;]+$/.test(node.textContent || "")) {
        const nxt = node.nextSibling as Element | null
        if (
          nxt &&
          nxt.nodeType === 1 &&
          (nxt as Element).matches?.("sup.cite")
        ) {
          seen.add(nxt)
          end = nxt
          node = nxt.nextSibling
          continue
        }
      }
      break
    }
    const before = sup.previousSibling
    const after = end.nextSibling
    if (
      before &&
      before.nodeType === 3 &&
      after &&
      after.nodeType === 3 &&
      /\(\s*$/.test(before.textContent || "") &&
      /^\s*\)/.test(after.textContent || "")
    ) {
      before.textContent = (before.textContent || "").replace(/\s*\(\s*$/, "")
      let rest = (after.textContent || "").replace(/^\s*\)/, "")
      const punct = rest.match(/^\s*([.,;:!?])/)
      if (punct) {
        // sentence/clause punctuation: glue it before the citation → "claim.[1]"
        before.textContent = (before.textContent || "") + punct[1]
        rest = rest.slice(punct[0].length)
      } else {
        // mid-sentence: keep a space before the citation → "claim [1] word"
        before.textContent = (before.textContent || "") + " "
      }
      after.textContent = rest
    }
  })
}

document.addEventListener("nav", applyCiteSuperscripts)
