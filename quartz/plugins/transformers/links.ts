import { QuartzTransformerPlugin } from "../types"
import {
  FullSlug,
  RelativeURL,
  SimpleSlug,
  TransformOptions,
  stripSlashes,
  simplifySlug,
  splitAnchor,
  resolveRelative,
  getFileExtension,
  transformLink,
} from "../../util/path"
import path from "path"
import { visit } from "unist-util-visit"
import isAbsoluteUrl from "is-absolute-url"
import { Root } from "hast"
const redirectEntries: { source: string; destination: string }[] = []

interface Options {
  /** How to resolve Markdown paths */
  markdownLinkResolution: TransformOptions["strategy"]
  /** Strips folders from a link so that it looks nice */
  prettyLinks: boolean
  openLinksInNewTab: boolean
  lazyLoad: boolean
  externalLinkIcon: boolean
}

const defaultOptions: Options = {
  markdownLinkResolution: "absolute",
  prettyLinks: true,
  openLinksInNewTab: false,
  lazyLoad: false,
  externalLinkIcon: true,
}

const SITE_HOSTS = new Set(["foreverchemicalsindex.com", "www.foreverchemicalsindex.com"])

function hostedInternalPath(href: string): string | null {
  if (!isAbsoluteUrl(href, { httpOnly: false })) return null
  try {
    const url = new URL(href)
    if (!SITE_HOSTS.has(url.hostname.toLowerCase())) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

function publicSlug(source: string): string {
  let value = source
  try {
    value = decodeURIComponent(value)
  } catch {
    // Keep the raw path when percent-encoding is malformed.
  }
  if (value.length > 1 && value.endsWith("/")) value = value.slice(0, -1)
  if (value.startsWith("/")) value = value.slice(1)
  return value
}

function fileSlugFor(publicPath: string, fileSlugs: ReadonlySet<string>): FullSlug | null {
  const slug = publicSlug(publicPath)
  if (slug === "" || slug === "index") return fileSlugs.has("index") ? ("index" as FullSlug) : null
  if (fileSlugs.has(slug)) return slug as FullSlug
  const indexSlug = `${slug}/index`
  if (fileSlugs.has(indexSlug)) return indexSlug as FullSlug
  return null
}

function buildRedirectMap(fileSlugs: ReadonlySet<string>): Map<string, FullSlug> {
  const map = new Map<string, FullSlug>()
  for (const entry of redirectEntries) {
    const dest = fileSlugFor(entry.destination, fileSlugs)
    if (!dest) continue
    map.set(publicSlug(entry.source), dest)
  }
  return map
}

function isStaticAsset(full: string): boolean {
  const ext = getFileExtension(full)
  return ext !== undefined && ext !== ".html" && ext !== ".md"
}

function slugExists(full: string, fileSlugs: ReadonlySet<string>, aliasSlugs: ReadonlySet<string>): boolean {
  const candidates = [full]
  if (full.endsWith("/index")) candidates.push(full.slice(0, -"/index".length))
  if (full === "" || full === "index" || full === "/") candidates.push("index", "")
  for (const candidate of candidates) {
    if (candidate === "" || candidate === "/" || candidate === "index") {
      if (fileSlugs.has("index")) return true
      continue
    }
    if (fileSlugs.has(candidate) || aliasSlugs.has(candidate) || fileSlugs.has(`${candidate}/index`)) {
      return true
    }
  }
  return false
}

function redirectFile(full: string, redirects: ReadonlyMap<string, FullSlug>): FullSlug | undefined {
  const direct = redirects.get(full)
  if (direct) return direct
  if (full.endsWith("/index")) return redirects.get(full.slice(0, -"/index".length))
  return undefined
}

export const CrawlLinks: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }
  return {
    name: "LinkProcessing",
    htmlPlugins(ctx) {
      const fileSlugs = new Set(ctx.allSlugs)
      const aliasSlugs = new Set(ctx.aliasSlugs ?? [])
      const redirects = buildRedirectMap(fileSlugs)
      return [
        () => {
          return (tree: Root, file) => {
            const curSlug = simplifySlug(file.data.slug!)
            const outgoing: Set<SimpleSlug> = new Set()

            const transformOptions: TransformOptions = {
              strategy: opts.markdownLinkResolution,
              allSlugs: ctx.allSlugs,
            }

            visit(tree, "element", (node, _index, _parent) => {
              // rewrite all links
              if (
                node.tagName === "a" &&
                node.properties &&
                typeof node.properties.href === "string"
              ) {
                let dest = node.properties.href as RelativeURL
                const hosted = hostedInternalPath(dest)
                if (hosted) dest = node.properties.href = hosted as RelativeURL
                const classes = (node.properties.className ?? []) as string[]
                const isExternal = isAbsoluteUrl(dest, { httpOnly: false })
                classes.push(isExternal ? "external" : "internal")

                if (isExternal && opts.externalLinkIcon) {
                  node.children.push({
                    type: "element",
                    tagName: "svg",
                    properties: {
                      "aria-hidden": "true",
                      class: "external-icon",
                      style: "max-width:0.8em;max-height:0.8em",
                      viewBox: "0 0 512 512",
                    },
                    children: [
                      {
                        type: "element",
                        tagName: "path",
                        properties: {
                          d: "M320 0H288V64h32 82.7L201.4 265.4 178.7 288 224 333.3l22.6-22.6L448 109.3V192v32h64V192 32 0H480 320zM32 32H0V64 480v32H32 456h32V480 352 320H424v32 96H64V96h96 32V32H160 32z",
                        },
                        children: [],
                      },
                    ],
                  })
                }

                // Check if the link has alias text
                if (
                  node.children.length === 1 &&
                  node.children[0].type === "text" &&
                  node.children[0].value !== dest
                ) {
                  // Add the 'alias' class if the text content is not the same as the href
                  classes.push("alias")
                }
                node.properties.className = classes

                if (isExternal && opts.openLinksInNewTab) {
                  node.properties.target = "_blank"
                }

                // don't process external links or intra-document anchors
                const isInternal = !(
                  isAbsoluteUrl(dest, { httpOnly: false }) || dest.startsWith("#")
                )
                if (isInternal) {
                  dest = node.properties.href = transformLink(
                    file.data.slug!,
                    dest,
                    transformOptions,
                  )

                  // url.resolve is considered legacy
                  // WHATWG equivalent https://nodejs.dev/en/api/v18/url/#urlresolvefrom-to
                  const url = new URL(dest, "https://base.com/" + stripSlashes(curSlug, true))
                  const canonicalDest = url.pathname
                  let [destCanonical, _destAnchor] = splitAnchor(canonicalDest)
                  if (destCanonical.endsWith("/")) {
                    destCanonical += "index"
                  }

                  // need to decodeURIComponent here as WHATWG URL percent-encodes everything
                  const full = decodeURIComponent(stripSlashes(destCanonical, true)) as FullSlug
                  const simple = simplifySlug(full)
                  if (isStaticAsset(full) || slugExists(full, fileSlugs, aliasSlugs)) {
                    outgoing.add(simple)
                    node.properties["data-slug"] = full
                  } else {
                    const destFile = redirectFile(full, redirects)
                    if (destFile) {
                      node.properties.href = `${resolveRelative(file.data.slug!, destFile)}${url.search}${url.hash}`
                      node.properties["data-slug"] = destFile
                      outgoing.add(simplifySlug(destFile))
                    } else {
                      // No page and no redirect. Plain text, so the build
                      // check never sees an href to a missing page.
                      node.tagName = "span"
                      node.properties = { className: ["unresolved"] }
                    }
                  }
                }

                // rewrite link internals if prettylinks is on
                //
                // NEVER basename an ALIASED link. prettyLinks exists to turn a
                // bare `[[folder/slug]]` into "slug" , but path.basename() splits
                // on "/", so an EXPLICIT alias that contains a slash was being
                // silently truncated: `[[sources/x|Blood Lead Reference Value
                // (3.5 µg/dL)]]` rendered as "dL)". An author-supplied alias is
                // display text, not a path, and must be left verbatim. The
                // "alias" class (added above when the text differs from the href)
                // is the exact signal for that.
                const isAlias = Array.isArray(node.properties.className)
                  ? node.properties.className.includes("alias")
                  : false
                if (
                  opts.prettyLinks &&
                  isInternal &&
                  node.tagName === "a" &&
                  !isAlias &&
                  node.children.length === 1 &&
                  node.children[0].type === "text" &&
                  !node.children[0].value.startsWith("#")
                ) {
                  node.children[0].value = path.basename(node.children[0].value)
                }
              }

              // transform all other resources that may use links
              if (
                ["img", "video", "audio", "iframe"].includes(node.tagName) &&
                node.properties &&
                typeof node.properties.src === "string"
              ) {
                if (opts.lazyLoad) {
                  node.properties.loading = "lazy"
                }

                if (!isAbsoluteUrl(node.properties.src, { httpOnly: false })) {
                  let dest = node.properties.src as RelativeURL
                  dest = node.properties.src = transformLink(
                    file.data.slug!,
                    dest,
                    transformOptions,
                  )
                  node.properties.src = dest
                }
              }
            })

            file.data.links = [...outgoing]
          }
        },
      ]
    },
  }
}

declare module "vfile" {
  interface DataMap {
    links: SimpleSlug[]
  }
}
