type FciSearchPage = { title?: string; description?: string; content?: string }
let fciShellAbort: AbortController | undefined
let fciSearchIndex: Promise<Record<string, FciSearchPage>> | undefined
function setupFciShell() {
  fciShellAbort?.abort()
  const controller = new AbortController(), signal = controller.signal
  fciShellAbort = controller
  document.querySelector<HTMLAnchorElement>(".skip-to-content")?.addEventListener("click", event => {
    const main = document.querySelector<HTMLElement>("#main-content")
    if (!main) return
    event.preventDefault(); event.stopPropagation()
    main.focus({preventScroll:true}); main.scrollIntoView({block:"start"})
  }, {signal})
  const menu = document.querySelector<HTMLButtonElement>(".fci-menu-toggle")
  const navigation = document.querySelector<HTMLElement>("#fci-primary-navigation")
  const mobile = window.matchMedia("(max-width: 1000px)")
  const closeMenu = () => { if (menu && navigation) { menu.setAttribute("aria-expanded", "false"); navigation.hidden = mobile.matches } }
  if (menu && navigation) {
    menu.hidden = false
    closeMenu()
    menu.addEventListener("click", () => { const open = menu.getAttribute("aria-expanded") !== "true"; menu.setAttribute("aria-expanded", String(open)); navigation.hidden = !open }, {signal})
    mobile.addEventListener("change", closeMenu, {signal})
    navigation.addEventListener("click", event => { if ((event.target as HTMLElement).closest("a")) closeMenu() }, {signal})
  }
  const dialog = document.querySelector<HTMLDialogElement>("#fci-search-dialog")
  const input = dialog?.querySelector<HTMLInputElement>("#fci-search-input")
  const status = dialog?.querySelector<HTMLElement>(".fci-search-status")
  const results = dialog?.querySelector<HTMLUListElement>(".fci-search-results")
  let returnFocus: HTMLElement | null = null, searchSequence = 0
  async function search() {
    const sequence = ++searchSequence, query = input?.value.trim().toLowerCase() ?? ""
    results?.replaceChildren()
    if (!query) { if (status) status.textContent = "Search the public reference pages. Scientific profiles are awaiting evidence review."; return }
    if (status) status.textContent = "Searching public pages..."
    try {
      fciSearchIndex ??= fetch("/static/contentIndex.json").then(response => { if (!response.ok) throw new Error("Search unavailable"); return response.json() })
      const index = await fciSearchIndex
      if (signal.aborted || sequence !== searchSequence || !results || !status) return
      const matches = Object.entries(index).filter(([, page]) => `${page.title ?? ""} ${page.description ?? ""} ${page.content ?? ""}`.toLowerCase().includes(query)).sort((a,b) => Number((b[1].title ?? "").toLowerCase().includes(query)) - Number((a[1].title ?? "").toLowerCase().includes(query))).slice(0,12)
      status.textContent = matches.length ? `${matches.length} public ${matches.length === 1 ? "page" : "pages"} found.` : "No matching public page. Scientific profiles remain under review."
      for (const [slug,page] of matches) {
        const item = document.createElement("li"), link = document.createElement("a"), description = document.createElement("p")
        link.href = "/" + slug.replace(/(^|\/)index$/, ""); link.textContent = page.title ?? slug
        description.textContent = page.description ?? "Public reference page"
        item.append(link, description); results.append(item)
      }
    } catch { fciSearchIndex = undefined; if (status && !signal.aborted) status.textContent = "Search is unavailable. Browse the section links or try again." }
  }
  document.querySelectorAll<HTMLButtonElement>("[data-search-open]").forEach(trigger => trigger.addEventListener("click", () => {
    if (!dialog || !input) return
    returnFocus = trigger; closeMenu(); dialog.showModal(); input.focus(); void search()
  }, {signal}))
  dialog?.querySelector("[data-search-close]")?.addEventListener("click", () => dialog.close(), {signal})
  dialog?.addEventListener("close", () => { ++searchSequence; returnFocus?.focus() }, {signal})
  results?.addEventListener("click", event => { if ((event.target as HTMLElement).closest("a")) dialog?.close() }, {signal})
  input?.addEventListener("input", () => void search(), {signal})
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return
    if (dialog?.open) { event.preventDefault(); dialog.close(); return }
    if (menu?.getAttribute("aria-expanded") === "true") { closeMenu(); menu.focus() }
  }, {signal})
  document.querySelectorAll<HTMLElement>(".wiki-content table").forEach((table,index) => {
    if (table.parentElement?.classList.contains("fci-table-scroll")) return
    const wrapper = document.createElement("div"); wrapper.className = "fci-table-scroll"; wrapper.tabIndex = 0; wrapper.setAttribute("role", "region")
    wrapper.setAttribute("aria-label", `${table.querySelector("caption")?.textContent ?? "Evidence table"} ${index+1}: scroll horizontally`)
    table.before(wrapper); wrapper.append(table)
  })
  if (typeof window.addCleanup === "function") window.addCleanup(() => controller.abort())
}
document.addEventListener("nav", setupFciShell)
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setupFciShell, {once:true}); else setupFciShell()
