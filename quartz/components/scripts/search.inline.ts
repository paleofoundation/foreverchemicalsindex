import { prepareSearchEntries, searchIndex, type PreparedSearchEntry } from "../../util/search"
import { type FullSlug, resolveRelative } from "../../util/path"

let entriesPromise: Promise<PreparedSearchEntry[]> | undefined
const getEntries = () => (entriesPromise ??= fetchData.then(prepareSearchEntries))
let searchId = 0

// The homepage search is authored as HTML in Markdown. Upgrade that legacy
// shell synchronously, before waiting on the index, so its visible field is
// immediately editable and never opens the former full-screen modal.
function upgradeShell(root: HTMLElement) {
  if (root.querySelector(".hmi-search-form")) return
  const input = root.querySelector<HTMLInputElement>(".search-bar")
  if (!input) return
  const form = document.createElement("form")
  form.className = "hmi-search-form"
  form.setAttribute("role", "search")
  form.setAttribute(
    "aria-label",
    root.classList.contains("hmi-v3-hero-search") ? "Homepage search" : "Site search",
  )
  input.type = "search"
  input.name = "q"
  input.setAttribute("role", "combobox")
  input.setAttribute("aria-autocomplete", "list")
  input.setAttribute("aria-expanded", "false")
  form.append(input)
  const submit = document.createElement("button")
  submit.type = "submit"
  submit.className = "hmi-search-submit"
  submit.textContent = "Search"
  form.append(submit)
  const dropdown = document.createElement("div")
  dropdown.className = "hmi-search-dropdown"
  dropdown.hidden = true
  const results = document.createElement("div")
  results.className = "hmi-search-results"
  results.setAttribute("role", "listbox")
  results.setAttribute("aria-label", "Suggested pages")
  const status = document.createElement("p")
  status.className = "hmi-search-status"
  status.setAttribute("role", "status")
  status.setAttribute("aria-live", "polite")
  dropdown.append(results, status)
  root.replaceChildren(form, dropdown)
  root.classList.add("hmi-inline-search")
}

function setupSearch(root: HTMLElement, slug: FullSlug) {
  if (root.dataset.searchReady) return
  upgradeShell(root)
  root.removeAttribute("role")
  const input = root.querySelector<HTMLInputElement>(".search-bar")
  const form = root.querySelector<HTMLFormElement>(".hmi-search-form")
  const dropdown = root.querySelector<HTMLElement>(".hmi-search-dropdown")
  const results = root.querySelector<HTMLElement>(".hmi-search-results")
  const status = root.querySelector<HTMLElement>(".hmi-search-status")
  if (!input || !form || !dropdown || !results || !status) return
  root.dataset.searchReady = "true"
  const id = `hmi-search-${++searchId}`
  results.id = `${id}-results`
  input.setAttribute("aria-controls", results.id)
  let selection = -1
  let revision = 0
  let active = false
  let timer: number | undefined

  const links = () => Array.from(results.querySelectorAll<HTMLAnchorElement>("a"))
  const close = () => {
    window.clearTimeout(timer)
    active = false
    revision++
    dropdown.hidden = true
    root.classList.remove("is-open")
    input.setAttribute("aria-expanded", "false")
    input.removeAttribute("aria-activedescendant")
    selection = -1
  }
  const open = () => {
    root.style.setProperty(
      "--hmi-search-dropdown-top",
      `${root.getBoundingClientRect().bottom + 8}px`,
    )
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight
    results.style.maxHeight = `${Math.max(96, Math.min(480, viewportHeight - root.getBoundingClientRect().bottom - 52))}px`
    active = true
    dropdown.hidden = false
    root.classList.add("is-open")
    input.setAttribute("aria-expanded", "true")
  }
  const select = (index: number) => {
    const options = links()
    selection = index
    options.forEach((option, i) => option.setAttribute("aria-selected", String(i === index)))
    if (options[index]) {
      input.setAttribute("aria-activedescendant", options[index].id)
      options[index].scrollIntoView({ block: "nearest" })
    } else input.removeAttribute("aria-activedescendant")
  }
  const render = async () => {
    const query = input.value.trim()
    const ticket = ++revision
    selection = -1
    input.removeAttribute("aria-activedescendant")
    results.replaceChildren()
    if (!query) {
      close()
      return
    }
    open()
    status.textContent = "Searching the index…"
    try {
      const entries = await getEntries()
      if (ticket !== revision || !root.isConnected || !active) return
      const matches = searchIndex(entries, query)
      status.textContent = matches.length
        ? `${matches.length} suggestions · Use ↑ ↓ and Enter to open`
        : "No matching pages. Try a food, metal, or a shorter phrase."
      matches.forEach((match, i) => {
        const link = document.createElement("a")
        link.className = "hmi-search-result"
        link.id = `${id}-option-${i}`
        link.href = resolveRelative(slug, match.slug as FullSlug)
        link.setAttribute("role", "option")
        link.setAttribute("aria-selected", "false")
        link.tabIndex = -1
        const heading = document.createElement("span")
        heading.className = "hmi-search-result-title"
        heading.textContent = match.title
        const family = document.createElement("span")
        family.className = "hmi-search-result-family"
        family.textContent = match.category
        const description = document.createElement("span")
        description.className = "hmi-search-result-description"
        description.textContent = match.description
        link.append(heading, family, description)
        results.append(link)
      })
    } catch {
      if (ticket !== revision || !active) return
      status.textContent = "Search could not load. Reload the page to try again."
    }
  }
  const onInput = () => {
    // Invalidate an outstanding query as soon as the input changes.
    revision++
    selection = -1
    input.removeAttribute("aria-activedescendant")
    results.replaceChildren()
    window.clearTimeout(timer)
    timer = window.setTimeout(render, 70)
  }
  const onFocus = () => {
    root.style.setProperty("--hmi-search-input-top", `${root.getBoundingClientRect().top}px`)
    void render()
  }
  const onSubmit = async (event: Event) => {
    event.preventDefault()
    window.clearTimeout(timer)
    if (selection >= 0 && links()[selection]) {
      links()[selection].click()
      return
    }
    const submittedQuery = input.value
    await render()
    if (!root.isConnected || !active || input.value !== submittedQuery) return
    // Enter from the field opens the strongest match; the Search button uses
    // the same action. It never moves typing to another field or a modal.
    links()[0]?.click()
  }
  const onKeydown = (event: KeyboardEvent) => {
    if (event.isComposing) return
    if (event.key === "Escape") {
      event.preventDefault()
      close()
      return
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      if (dropdown.hidden) {
        void render()
        return
      }
      const count = links().length
      if (count)
        select(
          selection < 0
            ? event.key === "ArrowDown"
              ? 0
              : count - 1
            : (selection + (event.key === "ArrowDown" ? 1 : -1) + count) % count,
        )
    }
    if (event.key === "Tab") close()
  }
  const onOutside = (event: PointerEvent) => {
    if (!root.contains(event.target as Node)) close()
  }
  const onFocusOut = (event: FocusEvent) => {
    if (!root.contains(event.relatedTarget as Node | null)) close()
  }
  const onResultClick = (event: MouseEvent) => {
    if ((event.target as Element).closest("a")) close()
  }
  input.addEventListener("input", onInput)
  input.addEventListener("focus", onFocus)
  input.addEventListener("keydown", onKeydown)
  form.addEventListener("submit", onSubmit)
  root.addEventListener("focusout", onFocusOut)
  results.addEventListener("click", onResultClick)
  document.addEventListener("pointerdown", onOutside)
  window.addCleanup(() => {
    close()
    window.clearTimeout(timer)
    delete root.dataset.searchReady
    input.removeEventListener("input", onInput)
    input.removeEventListener("focus", onFocus)
    input.removeEventListener("keydown", onKeydown)
    form.removeEventListener("submit", onSubmit)
    root.removeEventListener("focusout", onFocusOut)
    results.removeEventListener("click", onResultClick)
    document.removeEventListener("pointerdown", onOutside)
  })
}

function setupPageSearch() {
  const slug = (document.body.dataset.slug || "index") as FullSlug
  document.querySelectorAll<HTMLElement>(".search").forEach((root) => setupSearch(root, slug))
  if (slug === "index") {
    const query = new URLSearchParams(location.search).get("q")
    const hero = document.querySelector<HTMLInputElement>(".hmi-v3-hero-search .search-bar")
    if (query && hero && hero.value !== query) {
      hero.value = query
      hero.focus()
      hero.dispatchEvent(new Event("input", { bubbles: true }))
    }
  }
}

document.addEventListener("nav", setupPageSearch)
queueMicrotask(setupPageSearch)
// One global shortcut chooses one visible field. Former per-box listeners
// opened both nav and hero overlays at once on the homepage.
document.addEventListener("keydown", (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null
  const editing = target?.closest("input, textarea, select, [contenteditable='true']")
  const slash = event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey
  const commandK = event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)
  if ((!slash && !commandK) || (editing && !commandK)) return
  const input =
    document.querySelector<HTMLInputElement>(".hmi-topnav-search .search-bar") ??
    document.querySelector<HTMLInputElement>(".hmi-inline-search .search-bar")
  if (!input) return
  event.preventDefault()
  input.focus()
  input.select()
})
