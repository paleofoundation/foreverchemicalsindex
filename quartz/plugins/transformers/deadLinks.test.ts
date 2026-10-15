import test from "node:test"
import assert from "node:assert/strict"
import { unified } from "unified"
import { VFile } from "vfile"
import type { Element, Root } from "hast"
import type { BuildCtx } from "../../util/ctx"
import type { FullSlug } from "../../util/path"
import { CrawlLinks } from "./links"

function anchor(href: string, text: string): Element {
  return {
    type: "element",
    tagName: "a",
    properties: { href },
    children: [{ type: "text", value: text }],
  }
}

async function render(children: Element[], slugs: string[], aliasSlugs: string[] = []) {
  const ctx = { allSlugs: slugs, aliasSlugs } as BuildCtx
  const file = new VFile("")
  file.data.slug = "synthesis/review" as FullSlug
  const processor = unified().use(
    CrawlLinks({ markdownLinkResolution: "shortest" }).htmlPlugins!(ctx),
  )
  const tree = (await processor.run({ type: "root", children } as Root, file)) as Root
  const anchors: Element[] = []
  const spans: Element[] = []
  const collect = (node: { type: string; tagName?: string; properties?: Element["properties"]; children?: unknown[] }) => {
    if (node.type === "element" && node.tagName === "a") anchors.push(node as Element)
    if (node.type === "element" && node.tagName === "span") spans.push(node as Element)
    for (const child of node.children ?? []) collect(child as { type: string; children?: unknown[] })
  }
  collect(tree)
  return { file, anchors, spans }
}

const slugs = ["ingredients/almond", "metals/cadmium", "synthesis/review"]

test("a renamed slug is rewritten to the current page", async () => {
  const result = await render([anchor("ingredients/almonds", "ingredients/almonds")], slugs)
  assert.equal(result.anchors.length, 1)
  assert.equal(result.anchors[0].properties.href, "../ingredients/almond")
  assert.equal(result.anchors[0].properties["data-slug"], "ingredients/almond")
  assert.deepEqual(result.file.data.links, ["ingredients/almond"])
  assert.equal(result.spans.length, 0)
})

test("a page that does not exist becomes plain text", async () => {
  const result = await render([anchor("health/no-such-page", "health/no-such-page")], slugs)
  assert.equal(result.anchors.length, 0)
  assert.equal(result.spans.length, 1)
  assert.equal(result.spans[0].properties.href, undefined)
  assert.deepEqual(result.spans[0].properties.className, ["unresolved"])
  assert.deepEqual(result.file.data.links, [])
})

test("a live page stays a link", async () => {
  const result = await render([anchor("metals/cadmium", "metals/cadmium")], slugs)
  assert.equal(result.anchors.length, 1)
  assert.equal(result.anchors[0].properties.href, "../metals/cadmium")
  assert.equal(result.spans.length, 0)
})

test("the unpublished change log is plain text, including the absolute site URL", async () => {
  for (const href of ["/log", "https://foreverchemicalsindex.com/log"]) {
    const result = await render([anchor(href, "log")], slugs)
    assert.equal(result.anchors.length, 0, href)
    assert.equal(result.spans.length, 1, href)
    assert.equal(result.spans[0].properties.href, undefined)
  }
})

test("a static download stays a link", async () => {
  const result = await render(
    [anchor("/static/data/state-of-heavy-metals-in-food-2026.json", "JSON")],
    slugs,
  )
  assert.equal(result.anchors.length, 1)
  assert.equal(result.spans.length, 0)
  assert.match(String(result.anchors[0].properties.href), /state-of-heavy-metals-in-food-2026\.json$/)
})

test("an alias slug stays a link without joining the shortest-match set", async () => {
  const result = await render([anchor("carrots", "carrots")], slugs, ["carrots"])
  assert.equal(result.anchors.length, 1)
  assert.equal(result.spans.length, 0)
  assert.equal(result.anchors[0].properties["data-slug"], "carrots")
})
