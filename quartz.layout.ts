import SectionNavigation from "./quartz/components/SectionNavigation"
import ReadingRail from "./quartz/components/ReadingRail"
import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(), header: [Component.TopNav()],
  afterBody: [Component.Backlinks()], footer: Component.Footer(),
}
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [], left: [SectionNavigation()], right: [ReadingRail()],
}
export const defaultListPageLayout: PageLayout = {
  beforeBody: [], left: [SectionNavigation()], right: [ReadingRail()],
}
