import { QuartzFilterPlugin } from "../types"
import { publicationContext } from "../../../tools/lib/wiki.mjs"
import { isPublicWikiRecord } from "../../../tools/lib/source-publication.mjs"

export const RemoveDrafts: QuartzFilterPlugin<{}> = () => ({
  name: "RemoveDrafts",
  shouldPublish(_ctx, [_tree, vfile]) {
    return isPublicWikiRecord(vfile.data?.frontmatter ?? {}, vfile.data?.slug ?? "", publicationContext())
  },
})
