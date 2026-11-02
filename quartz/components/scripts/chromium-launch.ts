export function chromiumLaunchArgs(env: NodeJS.ProcessEnv = process.env): string[] {
  const ci = env.CI === "true" || env.GITHUB_ACTIONS === "true"
  return ci ? ["--no-sandbox", "--disable-setuid-sandbox"] : []
}
