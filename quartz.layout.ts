import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(), header: [Component.TopNav()],
  afterBody: [Component.Backlinks()], footer: Component.Footer(),
}
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [], left: [Component.TableOfContents()], right: [],
}
export const defaultListPageLayout: PageLayout = {
  beforeBody: [], left: [Component.TableOfContents()], right: [],
}
