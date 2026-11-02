export {} // module scope

// Share URLs and copy text are compiled once from the page's authored metadata.
// Never replace them with document.title/location.href after SPA navigation.
async function copyPost(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // A denied Clipboard API can still permit a user-initiated legacy copy.
    }
  }
  const previousFocus = document.activeElement as HTMLElement | null
  const field = document.createElement("textarea")
  field.value = text
  field.setAttribute("readonly", "")
  field.style.position = "fixed"
  field.style.left = "-9999px"
  document.body.appendChild(field)
  try {
    field.select()
    return document.execCommand("copy")
  } catch {
    return false
  } finally {
    field.remove()
    previousFocus?.focus({ preventScroll: true })
  }
}

function setupPostCopy() {
  document.querySelectorAll<HTMLButtonElement>("[data-hmi-share-copy-post]").forEach((button) => {
    if (button.dataset.hmiShareReady === "true") return
    button.dataset.hmiShareReady = "true"
    button.addEventListener("click", async () => {
      const root = button.closest<HTMLElement>("[data-hmi-share]")
      const post = root?.dataset.hmiSharePost
      if (!root || !post) return
      const ok = await copyPost(post)
      const status = root.querySelector<HTMLElement>("[data-hmi-share-status]")
      if (status) {
        status.textContent = ok ? "Post copied." : "Copy failed. Try the X share link."
        window.setTimeout(() => { status.textContent = "" }, 3000)
      }
    })
  })
}

document.addEventListener("nav", setupPostCopy)
queueMicrotask(setupPostCopy)
