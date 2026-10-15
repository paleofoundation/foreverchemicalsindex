import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { chromiumLaunchArgs } from "./chromium-launch"

describe("chromium launch args", () => {
  test("stays sandboxed outside CI", () => {
    assert.deepEqual(chromiumLaunchArgs({}), [])
  })

  test("disables the sandbox on GitHub Actions", () => {
    assert.deepEqual(chromiumLaunchArgs({ CI: "true", GITHUB_ACTIONS: "true" }), [
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ])
  })
})
