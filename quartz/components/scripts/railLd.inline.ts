// Fills the rail's "Structured data (JSON-LD)" disclosure from the page's own
// embedded JSON-LD, on first open.
//
// METHOD.md §5 specifies this as a disclosure toggle, not a link, which is what
// makes it buildable: v3 drives it with its own `toggleLd` runtime, and the
// repo has no equivalent , but the DATA is already on the page. Head.tsx emits
// `<script type="application/ld+json">` blocks, so the panel has a real source
// and does not need v3's runtime. An earlier pass shipped this row as a bare
// `#ld-json` anchor with no target, then removed it as a dead link; a
// disclosure is the correct third option.

document.addEventListener("nav", () => {
  const d = document.querySelector<HTMLDetailsElement>("details.rail-ld")
  if (!d || d.dataset.filled === "1") return

  d.addEventListener(
    "toggle",
    () => {
      if (!d.open || d.dataset.filled === "1") return
      const pre = d.querySelector<HTMLElement>(".rail-ld-panel")
      if (!pre) return
      const blocks = [...document.querySelectorAll('script[type="application/ld+json"]')]
        .map((s) => {
          try {
            return JSON.stringify(JSON.parse(s.textContent ?? ""), null, 2)
          } catch {
            return (s.textContent ?? "").trim()
          }
        })
        .filter(Boolean)
      pre.textContent = blocks.length ? blocks.join("\n\n") : "No structured data on this page."
      d.dataset.filled = "1"
    },
    { once: false },
  )
})
