// Adapted from HMI: missing destinations and orphan reference pages block builds.
import fs from "node:fs"
import path from "node:path"
import { published, simplify, fail } from "./lib/wiki.mjs"
const all = published(), slugs = new Set(all.map(page => simplify(page.slug))), inbound = new Map(), errors = []
for (const page of all) {
  const wikiLinks = [...page.content.matchAll(/\[\[([^\]|#]+)(?:[^\]]*)\]\]/g)].map(match => match[1])
  const mdLinks = [...page.content.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g)].map(match => match[1]).filter(link => !/^(?:https?:|mailto:|#)/.test(link))
  for (const link of [...wikiLinks, ...mdLinks]) {
    let target = decodeURIComponent(link.split("#")[0]).replace(/\.md$/, "").replace(/^\//, "")
    if (/^static\//.test(target)) {
      if (!fs.existsSync(path.join("wiki",target))) errors.push(`${page.file}: missing asset ${target}`)
      continue
    }
    if (!slugs.has(simplify(target))) target = path.posix.join(path.posix.dirname(page.slug), target)
    target = simplify(target).replace(/\/$/, "")
    if (!slugs.has(target)) errors.push(`${page.file}: missing destination ${link}`)
    else if (target !== simplify(page.slug)) inbound.set(target, true)
  }
}
for (const page of all) if (page.slug !== "index" && !inbound.has(simplify(page.slug))) errors.push(`${page.file}: orphan page`)
fail(errors, "audit-link-integrity")
