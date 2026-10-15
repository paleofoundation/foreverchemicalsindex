import { QuartzFilterPlugin } from "../types"
import { isPublicWikiRecord } from "../../../tools/lib/source-publication.mjs"

export const RemoveDrafts: QuartzFilterPlugin<{}> = () => ({
  name: "RemoveDrafts",
  shouldPublish(_ctx, [_tree, vfile]) {
    return isPublicWikiRecord(vfile.data?.frontmatter ?? {}, vfile.data?.slug ?? "")
  },
})
