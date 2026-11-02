// Expand-all / Collapse-all for the left-rail Explorer.
//
// Each control group targets the NEXT `.explorer` sibling in the DOM. It sets
// every `.folder-outer` open/closed and writes the same localStorage("fileTree")
// array the Explorer persists (one {path, collapsed} entry per folder), so the
// result survives SPA navigations identically to manual folder toggles.

type FolderState = { path: string; collapsed: boolean }

function nearestExplorer(el: HTMLElement): HTMLElement | null {
  // The controls render immediately before the explorer; walk forward siblings.
  let sib = el.nextElementSibling as HTMLElement | null
  while (sib) {
    if (sib.classList?.contains("explorer")) return sib
    const nested = sib.querySelector?.(".explorer") as HTMLElement | null
    if (nested) return nested
    sib = sib.nextElementSibling as HTMLElement | null
  }
  // Fallback: the explorer may share a flex container; search the parent.
  return (el.parentElement?.querySelector(".explorer") as HTMLElement | null) ?? null
}

function applyState(explorer: HTMLElement, open: boolean) {
  const containers = explorer.querySelectorAll<HTMLElement>(".folder-container[data-folderpath]")
  const state: FolderState[] = []
  containers.forEach((container) => {
    const path = container.dataset.folderpath
    if (!path) return
    const outer = container.nextElementSibling as HTMLElement | null
    if (outer && outer.classList.contains("folder-outer")) {
      if (open) {
        outer.classList.add("open")
      } else {
        outer.classList.remove("open")
      }
    }
    state.push({ path, collapsed: !open })
  })

  // Merge into the persisted tree so we don't clobber unrelated explorers.
  try {
    const raw = localStorage.getItem("fileTree")
    const prior: FolderState[] = raw ? JSON.parse(raw) : []
    const byPath = new Map(prior.map((s) => [s.path, s]))
    for (const s of state) byPath.set(s.path, s)
    localStorage.setItem("fileTree", JSON.stringify(Array.from(byPath.values())))
  } catch {
    // localStorage may be unavailable (private mode); DOM state already applied.
  }
}

function setupExplorerControls() {
  const groups = document.querySelectorAll<HTMLElement>(".hmi-explorer-controls")
  groups.forEach((group) => {
    const explorer = nearestExplorer(group)
    if (!explorer) return

    const onClick = (e: Event) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".hmi-explorer-control")
      if (!btn) return
      e.preventDefault()
      applyState(explorer, btn.dataset.action === "expand")
    }

    group.addEventListener("click", onClick)
    window.addCleanup(() => group.removeEventListener("click", onClick))
  })
}

document.addEventListener("nav", setupExplorerControls)
