import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { after, before, describe, test } from "node:test"
import { getInstalledBrowsers } from "@puppeteer/browsers"
import { transform } from "esbuild"
import puppeteer, { type Browser } from "puppeteer"
import { chromiumLaunchArgs } from "./chromium-launch"

const source = (label = "Smith et al.", slug = "smith2024", attributes = "") =>
  `<a href="../sources/${slug}" data-slug="sources/${slug}" ${attributes}>${label}</a>`

describe("source citation rendering", () => {
  let browser: Browser
  let script: string

  before(async () => {
    const input = await readFile(
      new URL("./citeSuperscript.inline.ts", import.meta.url),
      "utf8",
    )
    script = (await transform(input, { loader: "ts", format: "iife" })).code
    let executablePath = await puppeteer.executablePath()
    const { cacheDirectory } = await puppeteer.configuration()
    if (!existsSync(executablePath) && cacheDirectory) {
      // A dependency update may leave only an earlier compatible Chrome cached.
      const installed = await getInstalledBrowsers({
        cacheDir: cacheDirectory,
      })
      executablePath =
        installed.find((entry) => entry.browser === "chrome")?.executablePath ??
        executablePath
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

  async function render(markup: string, slug = "synthesis/example") {
    const page = await browser.newPage()
    try {
      await page.setContent(
        `<body data-slug="${slug}"><article class="wiki-content">${markup}</article></body>`,
      )
      await page.addScriptTag({ content: script })
      return await page.evaluate(() => {
        document.dispatchEvent(new CustomEvent("nav", { detail: {} }))
        const content = document.querySelector(".wiki-content")!
        const firstRender = content.innerHTML
        document.dispatchEvent(new CustomEvent("nav", { detail: {} }))
        const secondRender = content.innerHTML
        const clone = content.cloneNode(true) as HTMLElement
        clone.querySelectorAll(".cite-card").forEach((card) => card.remove())
        clone.querySelectorAll("sup.cite").forEach((cite) => {
          cite.replaceWith(`[${cite.textContent}]`)
        })
        return {
          firstRender,
          secondRender,
          prose: Array.from(clone.querySelectorAll("p"), (p) => p.textContent),
          strong: Array.from(
            clone.querySelectorAll("strong"),
            (el) => el.textContent,
          ),
          emphasis: Array.from(
            clone.querySelectorAll("em"),
            (el) => el.textContent,
          ),
          citations: Array.from(
            content.querySelectorAll("sup.cite"),
            (cite) => ({
              number: cite.querySelector(":scope > a")?.textContent,
              href: cite.querySelector(":scope > a")?.getAttribute("href"),
              authors: cite.querySelector(".cite-card-authors")?.textContent,
              title: cite.querySelector(".cite-card-title")?.textContent,
              journal: cite.querySelector(".cite-card-journal")?.textContent,
              review: cite
                .querySelector(".cite-card-review")
                ?.getAttribute("href"),
              reviewTarget: cite
                .querySelector(".cite-card-review")
                ?.getAttribute("target"),
              reviewRel: cite
                .querySelector(".cite-card-review")
                ?.getAttribute("rel"),
              fallback: cite.querySelector(".au")?.textContent,
            }),
          ),
          retainedLinks: Array.from(
            clone.querySelectorAll('a[data-slug^="sources/"]'),
            (a) => a.textContent,
          ),
        }
      })
    } finally {
      await page.close()
    }
  }

  test("keeps narrative words at paragraph and sentence starts and within sentences", async () => {
    const result = await render(
      [
        `<p>${source()} reported an association.</p>`,
        `<p>A prior study differed. ${source()} reported an association.</p>`,
        `<p>In this cohort, ${source()} measured exposure.</p>`,
        `<p>The review discusses ${source("the prospective study")} in detail.</p>`,
        `<p>(${source()}) reported an association.</p>`,
        `<p>A prior study differed. (${source()}) reported an association.</p>`,
      ].join(""),
    )
    assert.deepEqual(result.prose, [
      "Smith et al.[1] reported an association.",
      "A prior study differed. Smith et al.[1] reported an association.",
      "In this cohort, Smith et al.[1] measured exposure.",
      "The review discusses the prospective study[1] in detail.",
      "(Smith et al.[1]) reported an association.",
      "A prior study differed. (Smith et al.[1]) reported an association.",
    ])
    assert.equal(result.citations.length, 6)
    assert.equal(result.secondRender, result.firstRender)
  })

  test("preserves formatting inside source labels and around sentence subjects", async () => {
    const result = await render(
      `<p><strong>${source()}</strong> reported an association.</p>` +
        `<p>${source("<em>The prospective study</em>")} followed participants.</p>`,
    )
    assert.deepEqual(result.prose, [
      "Smith et al.[1] reported an association.",
      "The prospective study[1] followed participants.",
    ])
    assert.match(result.strong[0]!, /^Smith et al\.(?:\[1\])?$/)
    assert.deepEqual(result.emphasis, ["The prospective study"])
  })

  test("retains source labels in parentheses containing explanatory prose", async () => {
    const result = await render(
      `<p>The finding (${source()} studied adults) needs context.</p>`,
    )
    assert.deepEqual(result.prose, [
      "The finding (Smith et al.[1] studied adults) needs context.",
    ])
  })

  test("compacts citation-only parentheses after prose and places punctuation before citations", async () => {
    const result = await render(
      [
        `<p>The finding was replicated (${source()}).</p>`,
        `<p>The finding was replicated (${source()}, ${source("Jones et al.", "jones2025")}).</p>`,
        `<p>The finding was replicated (${source()}; ${source("Jones et al.", "jones2025")}); details follow.</p>`,
        `<p>The finding (${source()}) needs context.</p>`,
      ].join(""),
    )
    assert.deepEqual(result.prose, [
      "The finding was replicated.[1]",
      "The finding was replicated.[1], [2]",
      "The finding was replicated;[1]; [2] details follow.",
      "The finding [1] needs context.",
    ])
    assert.deepEqual(
      result.citations.map((cite) => cite.number),
      ["1", "1", "2", "1", "2", "1"],
    )
    assert.equal(result.secondRender, result.firstRender)
  })

  test("keeps hover metadata, source destinations, and fallback labels", async () => {
    const result = await render(
      `<p>${source("Smith study", "smith2024", 'data-authors="Smith et al. (2024)" data-title="Exposure study" data-journal="Example Journal" data-review-link="https://doi.org/10.1000/example"')} reported results.</p>` +
        `<p>Another finding (${source("Jones study", "jones2025")}).</p>`,
    )
    assert.deepEqual(result.citations[0], {
      number: "1",
      href: "../sources/smith2024",
      authors: "Smith et al. (2024)",
      title: "Exposure study",
      journal: "Example Journal",
      review: "https://doi.org/10.1000/example",
      reviewTarget: "_blank",
      reviewRel: "noopener",
    })
    assert.equal(result.citations[1].fallback, "Jones study")
    assert.equal(result.citations[1].href, "../sources/jones2025")
  })

  test("leaves navigation, headings, code, tables, and trailing references readable", async () => {
    const result = await render(
      `<nav>${source("Navigation")}</nav><h2>${source("Heading")}</h2>` +
        `<pre><code>${source("Code")}</code></pre>` +
        `<table><tbody><tr><td>${source("Table study")}</td></tr></tbody></table>` +
        `<p>${source("Narrative study")} reported results.</p>` +
        `<h2 id="references">References</h2><ol><li>${source("Full reference title")}</li></ol>` +
        `<h2 id="source-inventory">Source inventory</h2><p>${source("Inventory title")}</p>`,
    )
    assert.equal(result.citations.length, 1)
    assert.deepEqual(result.retainedLinks, [
      "Navigation",
      "Heading",
      "Code",
      "Table study",
      "Full reference title",
      "Inventory title",
    ])
    assert.equal(result.secondRender, result.firstRender)
  })

  test("does not convert homepage source links", async () => {
    const result = await render(`<p>${source("Sources")}</p>`, "index")
    assert.deepEqual(result.prose, ["Sources"])
    assert.equal(result.citations.length, 0)
    assert.deepEqual(result.retainedLinks, ["Sources"])
  })
})
