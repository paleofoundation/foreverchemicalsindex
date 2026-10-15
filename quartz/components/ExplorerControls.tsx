import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import style from "./styles/explorerControls.scss"
// @ts-ignore , inline script, resolved by Quartz's esbuild loader
import script from "./scripts/explorerControls.inline"

// Expand-all / Collapse-all control for the left-rail Explorer file tree
// (DECISIONS: under the per-page section-nav, an Expand/Collapse-all control,
// with the Explorer kept collapsed beneath). Rendered immediately above the
// Explorer; its inline script targets the NEXT sibling `.explorer` so the two
// stay decoupled (no shared IDs, works if there are multiple explorers).
//
// It mutates each folder's `.folder-outer.open` class and writes the same
// localStorage("fileTree") shape the Explorer itself persists, so the chosen
// state survives SPA navigations exactly like manual folder toggles do.

export default (() => {
  const ExplorerControls: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return (
      <div class={classNames(displayClass, "hmi-explorer-controls")} role="group" aria-label="Explorer controls">
        <button type="button" class="hmi-explorer-control" data-action="expand">
          Expand all
        </button>
        <span class="hmi-explorer-control-sep" aria-hidden="true">
          ·
        </span>
        <button type="button" class="hmi-explorer-control" data-action="collapse">
          Collapse all
        </button>
      </div>
    )
  }

  ExplorerControls.css = style
  ExplorerControls.afterDOMLoaded = script
  return ExplorerControls
}) satisfies QuartzComponentConstructor
