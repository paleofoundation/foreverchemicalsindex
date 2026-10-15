import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { after, before, describe, test } from "node:test"
import { getInstalledBrowsers } from "@puppeteer/browsers"
import { build } from "esbuild"
import puppeteer, { type Browser } from "puppeteer"
import { chromiumLaunchArgs } from "./chromium-launch"

describe("SPA stylesheet freshness", () => {
  let browser: Browser
  let script: string

  before(async () => {
    const output = await build({
      entryPoints: [fileURLToPath(new URL("./spa.inline.ts", import.meta.url))],
      bundle: true,
      write: false,
      format: "iife",
      platform: "browser",
    })
    script = output.outputFiles[0].text
    let executablePath = await puppeteer.executablePath()
    const { cacheDirectory } = await puppeteer.configuration()
    if (!existsSync(executablePath) && cacheDirectory) {
      const installed = await getInstalledBrowsers({
        cacheDir: cacheDirectory,
      })
      executablePath =
        installed.find((entry) => entry.browser === "chrome")?.executablePath ?? executablePath
    }
    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: chromiumLaunchArgs(),
    })
  })

  after(async () => {
    await browser?.close()
  })

  async function navigateToStylesheet(nextHash: string) {
    const page = await browser.newPage()
    const requests: string[] = []
    const markup = (hash: string, slug: string) => `<!doctype html><html><head>
      <title>${slug}</title>
      <link rel="stylesheet" href="../index.${hash}.css" data-persist="true">
      <link rel="stylesheet" href="../math.css" data-persist="true">
      <script data-persist="true">window.clientBuild = "${hash}"; window.persistedRuns = (window.persistedRuns || 0) + 1</script>
      </head><body data-slug="${slug}"><p class="hero">${slug}</p></body></html>`
    try {
      await page.setRequestInterception(true)
      page.on("request", (request) => {
        const pathname = new URL(request.url()).pathname
        requests.push(pathname)
        if (pathname.endsWith(".css")) {
          const css =
            pathname === "/index.new.css"
              ? ".hero { color: rgb(139, 42, 74) }"
              : pathname === "/index.old.css"
                ? ".hero { color: rgb(28, 67, 173) }"
                : ".hero { font-size: 18px }"
          void request.respond({
            status: 200,
            contentType: "text/css",
            body: css,
          })
        } else if (pathname === "/initial") {
          void request.respond({
            status: 200,
            contentType: "text/html",
            body: markup("old", "initial"),
          })
        } else if (pathname === "/next") {
          void request.respond({
            status: 200,
            contentType: "text/html",
            body: markup(nextHash, "next"),
          })
        } else {
          void request.abort()
        }
      })
      await page.goto("https://hmi.test/initial")
      await page.addScriptTag({ content: script })
      await page.evaluate(() => {
        const state = window as Window & { testRefs?: Array<Element | null> }
        state.testRefs = [
          document.querySelector('link[href*="index.old.css"]'),
          document.querySelector('link[href*="math.css"]'),
          document.querySelector("script[data-persist]"),
        ]
      })
      if (nextHash === "old") {
        await page.evaluate(async () => {
          await window.spaNavigate(new URL("https://hmi.test/next"))
        })
      } else {
        await Promise.all([
          page.waitForNavigation({ waitUntil: "load" }),
          page.evaluate(() => {
            void window.spaNavigate(new URL("https://hmi.test/next"))
          }),
        ])
      }
      const result = await page.evaluate(() => {
        const state = window as Window & {
          testRefs?: Array<Element | null>
          persistedRuns?: number
          clientBuild?: string
        }
        return {
          stylesheets: Array.from(
            document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
            (link) => new URL(link.href).pathname,
          ),
          color: getComputedStyle(document.querySelector(".hero")!).color,
          body: document.body.dataset.slug,
          originalRetained: state.testRefs?.[0]?.isConnected ?? false,
          mathRetained: document.querySelector('link[href*="math.css"]') === state.testRefs?.[1],
          scriptRetained: document.querySelector("script[data-persist]") === state.testRefs?.[2],
          scriptRuns: state.persistedRuns,
          clientBuild: state.clientBuild,
        }
      })
      return { ...result, requests }
    } finally {
      await page.close()
    }
  }

  test("loads a complete document with matching CSS and scripts when the build changes", async () => {
    const result = await navigateToStylesheet("new")
    assert.deepEqual(result.stylesheets, ["/index.new.css", "/math.css"])
    assert.equal(result.color, "rgb(139, 42, 74)")
    assert.equal(result.body, "next")
    assert.equal(result.originalRetained, false)
    assert.equal(result.mathRetained, false)
    assert.equal(result.scriptRetained, false)
    assert.equal(result.clientBuild, "new")
    assert.equal(result.scriptRuns, 1)
    assert.equal(result.requests.filter((url) => url === "/index.new.css").length, 1)
  })

  test("keeps stylesheet elements and requests unchanged within the same build", async () => {
    const result = await navigateToStylesheet("old")
    assert.deepEqual(result.stylesheets, ["/index.old.css", "/math.css"])
    assert.equal(result.color, "rgb(28, 67, 173)")
    assert.equal(result.body, "next")
    assert.equal(result.originalRetained, true)
    assert.equal(result.mathRetained, true)
    assert.equal(result.scriptRetained, true)
    assert.equal(result.scriptRuns, 1)
    assert.equal(result.requests.filter((url) => url.endsWith(".css")).length, 2)
  })
})
