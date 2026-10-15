// Collapsible left section-nav (.snav), matching microbiomemedicine: only the
// section currently in view shows its subsections (scroll-spy), and clicking a
// parent that has children pins it open/closed. Mirrors the IntersectionObserver
// in toc.inline.ts; the CSS reveal keys off `.in-view` (scroll-spy) and
// `.expanded` (manual pin). No-JS fallback: the `:has(.in-view)` rule still
// works if only the shared toc observer is present.
const snavObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const slug = entry.target.id
    const els = document.querySelectorAll(`.snav a[data-for="${slug}"]`)
    const wh = entry.rootBounds?.height
    if (wh && els.length > 0) {
      const inView = entry.boundingClientRect.y < wh && entry.boundingClientRect.bottom > 0
      els.forEach((el) => el.classList.toggle("in-view", inView))
    }
  }
})

function onSnavSecClick(this: HTMLElement) {
  const grp = this.closest(".grp")
  if (!grp || grp.classList.contains("snav-further")) return
  // A grouping parent (has children) toggles; a direct parent navigates as usual.
  if (!grp.querySelector("a.sub")) return
  grp.classList.toggle("expanded")
}

function setupSnav() {
  const snav = document.querySelector(".snav")
  if (!snav) return
  const toggle = snav.querySelector<HTMLButtonElement>(".snav-toggle")
  if (toggle) {
    toggle.hidden = false
    const onToggle = () => toggle.setAttribute("aria-expanded", String(toggle.getAttribute("aria-expanded") !== "true"))
    toggle.addEventListener("click", onToggle)
    const onNavigate = (event: Event) => {
      if ((event.target as Element).closest("a[href^='#']")) toggle.setAttribute("aria-expanded", "false")
    }
    snav.addEventListener("click", onNavigate)
    window.addCleanup(() => {
      toggle.removeEventListener("click", onToggle)
      snav.removeEventListener("click", onNavigate)
    })
  }
  snav.querySelectorAll(".grp:not(.snav-further) > a.sec").forEach((sec) => {
    const el = sec as HTMLElement
    el.addEventListener("click", onSnavSecClick)
    window.addCleanup(() => el.removeEventListener("click", onSnavSecClick))
  })
}

document.addEventListener("nav", () => {
  setupSnav()
  snavObserver.disconnect()
  document
    .querySelectorAll("h1[id], h2[id], h3[id], h4[id]")
    .forEach((h) => snavObserver.observe(h))
})
