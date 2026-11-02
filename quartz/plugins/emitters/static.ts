import { FilePath, QUARTZ, joinSegments } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import fs from "fs"
import { glob } from "../../util/glob"
import { basename, dirname } from "path"

// Google Search Console HTML-file tokens live in quartz/static and must also
// be copied to the site root. Vercel cleanUrls serves /googleTOKEN from
// public/googleTOKEN.html; a file that only exists at /static/googleTOKEN.html
// 404s after the .html extension is stripped.
const GSC_HTML_VERIFY = /^google[0-9a-f]+\.html$/i

export const Static: QuartzEmitterPlugin = () => ({
  name: "Static",
  async *emit({ argv, cfg }) {
    const staticPath = joinSegments(QUARTZ, "static")
    const fps = await glob("**", staticPath, cfg.configuration.ignorePatterns)
    const outputStaticPath = joinSegments(argv.output, "static")
    await fs.promises.mkdir(outputStaticPath, { recursive: true })
    for (const fp of fps) {
      const src = joinSegments(staticPath, fp) as FilePath
      const dest = joinSegments(outputStaticPath, fp) as FilePath
      await fs.promises.mkdir(dirname(dest), { recursive: true })
      await fs.promises.copyFile(src, dest)
      yield dest

      const fileName = basename(fp)
      if (GSC_HTML_VERIFY.test(fileName) && fileName === fp) {
        const rootDest = joinSegments(argv.output, fileName) as FilePath
        await fs.promises.copyFile(src, rootDest)
        yield rootDest
      }
    }
  },
  async *partialEmit() {},
})
