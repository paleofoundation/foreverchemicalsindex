import { render } from "preact-render-to-string"
import { QuartzComponent, QuartzComponentProps } from "./types"
import BodyConstructor from "./Body"
import HeroBandConstructor from "./HeroBand"
import { JSResource, JSResourceToScriptElement, StaticResources } from "../util/resources"
import { FullSlug, RelativeURL, joinSegments, normalizeHastElement } from "../util/path"
import { INDEX_CSS_NAME } from "../util/staticHash"
import { clone } from "../util/clone"
import { visit } from "unist-util-visit"
import { Root, Element, ElementContent } from "hast"
import { GlobalConfiguration } from "../cfg"
import { BuildCtx } from "../util/ctx"
import { hasBeforeDOMScripts } from "../plugins/emitters/componentResources"
import { i18n } from "../i18n"
import { styleText } from "util"

interface RenderComponents {
  head: QuartzComponent
  header: QuartzComponent[]
  beforeBody: QuartzComponent[]
  pageBody: QuartzComponent
  afterBody: QuartzComponent[]
  left: QuartzComponent[]
  right: QuartzComponent[]
  footer: QuartzComponent
}

const headerRegex = new RegExp(/h[1-6]/)
export function pageResources(
  baseDir: FullSlug | RelativeURL,
  staticResources: StaticResources,
  ctx?: BuildCtx,
): StaticResources {
  const contentIndexPath = joinSegments(baseDir, "static/contentIndex.json")
  const contentIndexScript = `const fetchData = fetch("${contentIndexPath}").then(data => data.json())`

  // componentResources only writes prescript.js when some component actually
  // contributes a beforeDOMReady script. Referencing it unconditionally shipped
  // a render-blocking <script src> for a 0-byte file on every page. Callers
  // without a ctx keep the old behaviour so the reference can never 404.
  const prescript: JSResource[] =
    !ctx || hasBeforeDOMScripts(ctx)
      ? [
          {
            src: joinSegments(baseDir, "prescript.js"),
            loadTime: "beforeDOMReady",
            contentType: "external",
          },
        ]
      : []

  const resources: StaticResources = {
    css: [
      {
        // Build-hashed stylesheet name (INDEX_CSS_NAME = index.<hash>.css), the
        // same name componentResources.ts emits, so new markup never loads
        // against a stale index.css a browser cached from a previous deploy.
        content: joinSegments(baseDir, INDEX_CSS_NAME),
      },
      ...staticResources.css,
    ],
    js: [
      ...prescript,
      {
        loadTime: "beforeDOMReady",
        contentType: "inline",
        spaPreserve: true,
        script: contentIndexScript,
      },
      ...staticResources.js,
    ],
    additionalHead: staticResources.additionalHead,
  }

  resources.js.push({
    src: joinSegments(baseDir, "postscript.js"),
    loadTime: "afterDOMReady",
    moduleType: "module",
    contentType: "external",
  })

  return resources
}

function renderTranscludes(
  root: Root,
  cfg: GlobalConfiguration,
  slug: FullSlug,
  componentData: QuartzComponentProps,
  visited: Set<FullSlug>,
) {
  // process transcludes in componentData
  visit(root, "element", (node, _index, _parent) => {
    if (node.tagName === "blockquote") {
      const classNames = (node.properties?.className ?? []) as string[]
      if (classNames.includes("transclude")) {
        const inner = node.children[0] as Element
        const transcludeTarget = (inner.properties["data-slug"] ?? slug) as FullSlug
        if (visited.has(transcludeTarget)) {
          console.warn(
            styleText(
              "yellow",
              `Warning: Skipping circular transclusion: ${slug} -> ${transcludeTarget}`,
            ),
          )
          node.children = [
            {
              type: "element",
              tagName: "p",
              properties: { style: "color: var(--secondary);" },
              children: [
                {
                  type: "text",
                  value: `Circular transclusion detected: ${transcludeTarget}`,
                },
              ],
            },
          ]
          return
        }
        visited.add(transcludeTarget)

        const page = componentData.allFiles.find((f) => f.slug === transcludeTarget)
        if (!page) {
          return
        }

        let blockRef = node.properties.dataBlock as string | undefined
        if (blockRef?.startsWith("#^")) {
          // block transclude
          blockRef = blockRef.slice("#^".length)
          let blockNode = page.blocks?.[blockRef]
          if (blockNode) {
            if (blockNode.tagName === "li") {
              blockNode = {
                type: "element",
                tagName: "ul",
                properties: {},
                children: [blockNode],
              }
            }

            node.children = [
              normalizeHastElement(blockNode, slug, transcludeTarget),
              {
                type: "element",
                tagName: "a",
                properties: { href: inner.properties?.href, class: ["internal", "transclude-src"] },
                children: [
                  { type: "text", value: i18n(cfg.locale).components.transcludes.linkToOriginal },
                ],
              },
            ]
          }
        } else if (blockRef?.startsWith("#") && page.htmlAst) {
          // header transclude
          blockRef = blockRef.slice(1)
          let startIdx = undefined
          let startDepth = undefined
          let endIdx = undefined
          for (const [i, el] of page.htmlAst.children.entries()) {
            // skip non-headers
            if (!(el.type === "element" && el.tagName.match(headerRegex))) continue
            const depth = Number(el.tagName.substring(1))

            // lookin for our blockref
            if (startIdx === undefined || startDepth === undefined) {
              // skip until we find the blockref that matches
              if (el.properties?.id === blockRef) {
                startIdx = i
                startDepth = depth
              }
            } else if (depth <= startDepth) {
              // looking for new header that is same level or higher
              endIdx = i
              break
            }
          }

          if (startIdx === undefined) {
            return
          }

          node.children = [
            ...(page.htmlAst.children.slice(startIdx, endIdx) as ElementContent[]).map((child) =>
              normalizeHastElement(child as Element, slug, transcludeTarget),
            ),
            {
              type: "element",
              tagName: "a",
              properties: { href: inner.properties?.href, class: ["internal", "transclude-src"] },
              children: [
                { type: "text", value: i18n(cfg.locale).components.transcludes.linkToOriginal },
              ],
            },
          ]
        } else if (page.htmlAst) {
          // page transclude
          node.children = [
            {
              type: "element",
              tagName: "h1",
              properties: {},
              children: [
                {
                  type: "text",
                  value:
                    page.frontmatter?.title ??
                    i18n(cfg.locale).components.transcludes.transcludeOf({
                      targetSlug: page.slug!,
                    }),
                },
              ],
            },
            ...(page.htmlAst.children as ElementContent[]).map((child) =>
              normalizeHastElement(child as Element, slug, transcludeTarget),
            ),
            {
              type: "element",
              tagName: "a",
              properties: { href: inner.properties?.href, class: ["internal", "transclude-src"] },
              children: [
                { type: "text", value: i18n(cfg.locale).components.transcludes.linkToOriginal },
              ],
            },
          ]
        }
      }
    }
  })
}

export function renderPage(
  cfg: GlobalConfiguration,
  slug: FullSlug,
  componentData: QuartzComponentProps,
  components: RenderComponents,
  pageResources: StaticResources,
): string {
  // make a deep copy of the tree so we don't remove the transclusion references
  // for the file cached in contentMap in build.ts
  const root = clone(componentData.tree) as Root
  const visited = new Set<FullSlug>([slug])
  renderTranscludes(root, cfg, slug, componentData, visited)

  // set componentData.tree to the edited html that has transclusions rendered
  componentData.tree = root

  const {
    head: Head,
    header,
    beforeBody,
    pageBody: Content,
    afterBody,
    left,
    right,
    footer: Footer,
  } = components
  const Body = BodyConstructor()
  const HeroBand = HeroBandConstructor()
  // The homepage carries its own full-bleed hero, so it opts out of the proof's
  // 3-column grid (no snav/rail) and renders full-width.
  const isHome = (slug as string) === "index"
  // Auth screens render a single centered card (no hero / snav / rail).
  const isAuth = (slug as string) === "login" || (slug as string) === "signup"
  // The 404 page carries its own heading (pages/404.tsx). A research hero band
  // above it would be both meaningless and a second <h1> on the page.
  const isError = (slug as string) === "404"
  // /ask is an app surface, not a document. The v3 design (Forever Chemicals Index
  // v3.dc.html, ASK THE INDEX branch, lines 264-360) gives it a bespoke
  // full-bleed burgundy hero with the question card inside , NOT the standard
  // masthead, whose Author / Cite-this-page / Version-history / snapshot chrome
  // is meaningless on a chat interface. Like the homepage, it opts out of the
  // masthead and the 3-column rail grid and carries its own hero in the body.
  const isAsk = (slug as string) === "ask"

  const lang = componentData.fileData.frontmatter?.lang ?? cfg.locale?.split("-")[0] ?? "en"
  const direction = i18n(cfg.locale).direction ?? "ltr"
  const doc = (
    <html lang={lang} dir={direction}>
      <Head {...componentData} />
      <body data-slug={slug}>
        <a href="#main-content" class="skip-to-content">
          Skip to content
        </a>
        {/*
          Full-width shared header (the global TopNav). Lifted OUTSIDE
          #quartz-root so it escapes .page's max-width + auto-margins and spans
          the entire viewport as a sticky bar. The shared `header` array
          (quartz.layout.ts sharedPageComponents.header) renders here; the bar
          re-centers its own content to the page width internally
          (.hmi-topnav-inner). Renders nothing if `header` is empty.
        */}
        {header.length > 0 && (
          <header class="hmi-topnav-shell">
            {header.map((HeaderComponent) => (
              <HeaderComponent {...componentData} />
            ))}
          </header>
        )}
        {/* Full-width burgundy hero band (microbiomemedicine-style), lifted
            outside #quartz-root so it spans the viewport; content pages only. */}
        {!isAuth && !isError && !isAsk && <HeroBand {...componentData} />}
        {isAuth ? (
          <div id="quartz-root" class="page proof proof-auth">
            <main class="hmi-auth-page" id="main-content" tabindex={-1}>

            </main>
          </div>
        ) : (
        <div id="quartz-root" class={isHome ? "page proof proof-home" : isAsk ? "page proof proof-ask" : "page proof"}>
          <Body {...componentData}>
            {[<div key="proof-container" class="proof-container">
              <div class="proof-layout">
                <aside class="snav">
                  <nav aria-label="On this page">
                    <button class="snav-toggle" type="button" aria-expanded="false" aria-controls="article-contents" hidden>On this page <span aria-hidden="true">⌄</span></button>
                    <div class="snav-content" id="article-contents">
                      {left.map((BodyComponent) => (
                        <BodyComponent {...componentData} />
                      ))}
                    </div>
                  </nav>
                </aside>
                <main class="proof-main" id="main-content" tabindex={-1}>
                  <div class="article-brief popover-hint">
                    {beforeBody.map((BodyComponent) => (
                      <BodyComponent {...componentData} />
                    ))}
                  </div>
                  <div class="wiki-content">
                    <Content {...componentData} />
                  </div>
                  <div class="page-footer">
                    {afterBody.map((BodyComponent) => (
                      <BodyComponent {...componentData} />
                    ))}
                  </div>
                </main>
                <aside class="rail">
                  {right.map((BodyComponent) => (
                    <BodyComponent {...componentData} />
                  ))}
                </aside>
              </div>
            </div>]}
          </Body>
        </div>
        )}
        <Footer {...componentData} />
      </body>
      {pageResources.js
        .filter((resource) => resource.loadTime === "afterDOMReady")
        .map((res) => JSResourceToScriptElement(res, true))}
    </html>
  )

  return "<!DOCTYPE html>\n" + render(doc)
}
