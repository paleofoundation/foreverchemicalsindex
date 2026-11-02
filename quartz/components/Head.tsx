import { QuartzComponent, QuartzComponentConstructor } from "./types"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { googleFontHref } from "../util/theme"
import { simplifySlug } from "../util/path"
const Head: QuartzComponent = ({ cfg, fileData, externalResources }) => {
  const slug = fileData.slug === "index" ? "" : simplifySlug(fileData.slug!)
  const canonical = `https://${cfg.baseUrl}/${slug}`
  const title = String(fileData.frontmatter?.title ?? cfg.pageTitle)
  const description = String(fileData.description ?? "Free public index of PFAS measurements quoted from cited studies. Empty sections are gaps, not measured zeros.")
  return <head>
    <meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title === cfg.pageTitle ? title : `${title} | ${cfg.pageTitle}`}</title>
    <meta name="description" content={description} />
    {fileData.slug === "404" ? <meta name="robots" content="noindex" /> : <link rel="canonical" href={canonical} />}
    <meta property="og:title" content={title} /><meta property="og:description" content={description} />
    {fileData.slug !== "404" && <meta property="og:url" content={canonical} />}<meta property="og:site_name" content={cfg.pageTitle} />
    <meta property="og:type" content={fileData.frontmatter?.type === "source" ? "article" : "website"} />
    {cfg.theme.fontOrigin === "googleFonts" && <link rel="stylesheet" href={googleFontHref(cfg.theme)} />}
    {externalResources.css.map(resource => CSSResourceToStyleElement(resource, true))}
    {externalResources.js.filter(resource => resource.loadTime === "beforeDOMReady").map(resource => JSResourceToScriptElement(resource, true))}
  </head>
}
export default (() => Head) satisfies QuartzComponentConstructor
