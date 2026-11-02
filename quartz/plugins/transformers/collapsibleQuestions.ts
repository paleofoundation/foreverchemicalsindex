import { QuartzTransformerPlugin } from "../types"
import { Root, Element, ElementContent, Text } from "hast"

// Build-time: converts every question-style <h3> (heading text ending in "?")
// into a collapsed <details class="qa"> accordion, matching the v3 "Questions
// this page answers" pattern (a burgundy "+" that becomes "−" on open , the
// glyph is a CSS ::before on an empty .mk span, styled in proof-design.scss).
// The h3 and its following flow content (up to the next h1/h2/h3) are folded
// into the accordion body.
//
// Why build-time and not a client script: the collapsible AND its answer must be
// in the static HTML so (1) crawlers/LLM bots see the answer without clicking,
// and (2) postbuild-inject-jsonld.mjs can read the `data-hmi-faq` markup and emit
// FAQPage structured data. A render-time JS transform would satisfy neither.
//
// The emitted markup reproduces the exact contract postbuild's
// extractAccordionItems() parses:
//   <details class="qa" data-hmi-faq="1" data-anchor=ID data-question=TEXT>
//     <summary><span class="mk"></span>QUESTION</summary>
//     <div class="ans" data-hmi-faq-answer="1"> …section body… </div>
//   </details>
// so the question sections render as the v3 accordion AND become FAQPage Q&As.
// The .mk span is intentionally empty: its "+"/"−" glyph is a CSS ::before, so
// the collapsed/open state is a style concern, not markup the extractor must
// parse. (postbuild-inject-jsonld reads data-question / .ans, never the marker.)
//
// Registered after TableOfContents so headings already carry slug ids.

const HEADINGS = new Set(["h1", "h2", "h3"])

function textOf(node: ElementContent | Root): string {
  if (node.type === "text") return (node as Text).value
  if ("children" in node && node.children) {
    return (node.children as ElementContent[]).map(textOf).join("")
  }
  return ""
}

function isQuestionHeading(node: ElementContent): node is Element {
  return (
    node.type === "element" &&
    node.tagName === "h3" &&
    textOf(node).trim().endsWith("?")
  )
}

// Rebuild a children array, folding each question-h3 (plus the flow content that
// follows it, up to the next heading) into a <details class="qa">.
function foldQuestions(children: ElementContent[]): ElementContent[] {
  const out: ElementContent[] = []
  for (let i = 0; i < children.length; i++) {
    const node = children[i]
    if (!isQuestionHeading(node)) {
      out.push(node)
      continue
    }
    const h3 = node as Element
    const questionText = textOf(h3).trim()
    const anchor =
      typeof h3.properties?.id === "string" ? (h3.properties.id as string) : undefined

    // Gather the section body: siblings until the next heading.
    const body: ElementContent[] = []
    let j = i + 1
    while (j < children.length) {
      const sib = children[j]
      if (sib.type === "element" && HEADINGS.has((sib as Element).tagName)) break
      body.push(sib)
      j++
    }
    i = j - 1

    // The summary keeps the h3's own inline children (so any inline formatting or
    // anchor link inside the heading survives), preceded by the marker.
    const summary: Element = {
      type: "element",
      tagName: "summary",
      properties: {},
      children: [
        // Empty marker; the "+"/"−" glyph is drawn by CSS (.qa summary .mk::before).
        { type: "element", tagName: "span", properties: { className: ["mk"], "aria-hidden": "true" }, children: [] },
        ...(h3.children as ElementContent[]),
      ],
    }
    const ans: Element = {
      type: "element",
      tagName: "div",
      properties: { className: ["ans"], "data-hmi-faq-answer": "1" },
      children: body,
    }
    const details: Element = {
      type: "element",
      tagName: "details",
      properties: {
        className: ["qa"],
        "data-hmi-faq": "1",
        ...(anchor ? { "data-question": questionText, "data-anchor": anchor, id: anchor } : { "data-question": questionText }),
      },
      children: [summary, ans],
    }
    out.push(details)
  }
  return out
}

// A question h3 lives directly under the content root's flow (Quartz drops the
// leading h1 via TitleHeading, so h2/h3 are top-level siblings). Fold at any
// container that holds an h3 , recursing first so nested containers are handled,
// though in practice the body is flat.
function transform(node: Root | Element): void {
  if (!("children" in node) || !node.children) return
  for (const child of node.children as ElementContent[]) {
    if (child.type === "element") transform(child as Element)
  }
  const hasQuestion = (node.children as ElementContent[]).some(isQuestionHeading)
  if (hasQuestion) {
    node.children = foldQuestions(node.children as ElementContent[]) as typeof node.children
  }
}

export const CollapsibleQuestions: QuartzTransformerPlugin = () => {
  return {
    name: "CollapsibleQuestions",
    htmlPlugins() {
      return [
        () => (tree: Root) => {
          transform(tree)
        },
      ]
    },
  }
}
