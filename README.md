# Forever Chemicals Index

Free public evidence index for PFAS (forever chemicals), sister site of the [Heavy Metal Index](https://heavymetalindex.com) and part of the [Institute of Contaminant Standards](https://contaminantstandards.com) reference network.

Category and analyte pages quote measurements that were transcribed from studies already in this repository. The quotation keeps the printed value, unit, basis, and source location. Pages with no transcription say so. An empty section is a gap, not a measured zero, and not a product endorsement.

The JSON and CSV downloads include only rows that pass the structured review gate in `tools/lib/discovery.mjs`. Transcribed rows that do not pass that gate stay on the page, in `source_reported_rows` on the source record, and out of the download. The proposed discovery policy stays unapproved, so no profile is marked READY.

## Local checks

Use the Node and npm versions declared in package.json. Run `npm ci`, `npm test`, `npm run check`, and `npm run build`. The build compiles the Quartz site from `wiki/` into `public/`, then checks links, canonical URLs, the sitemap, `robots.txt`, and `llms.txt`.

`npm run serve` serves the built files locally. There is no application backend, credential, or analytics identifier.

## How this repository deploys

The site is a static Quartz export. `vercel.json` is the hosting config:

- Build command: `npm run build`
- Output directory: `public`
- Clean URLs, no trailing slash
- Security headers on every path
- `sitemap.xml` and `robots.txt` cache headers
- `git.deploymentEnabled` is `false`, so connecting the GitHub repository to Vercel does not publish a push by itself

There is no Wrangler config, Cloudflare Worker, or other host file. `middleware.ts` is Vercel middleware. It returns 404 for `/staff`, `/admin`, and `/workbench` only. It does not render the site.

The Vercel project already exists: name `foreverchemicalsindex`, id `prj_Pqmzq0OiBWePka67YSwULjOPJZAu`, team `team_qSB41Q0YIPL29XCzvsxgu91R` (karen-pendergrass-projects). As of this change it is not a production deployment (`live: false`). Its attached hostnames are `foreverchemicalsindex.vercel.app` and `foreverchemicalsindex-karen-pendergrass-projects.vercel.app`. `foreverchemicalsindex.com` is not on that project and is not in the team domain list. Recent deployments have an empty Git metadata block and `target: null`, so they are not production builds from this repository. The project Node version is 24.x, which satisfies `engines.node`. Framework preset is unset. SSO protection is on for every deployment except custom domains.

To put foreverchemicalsindex.com on this build:

1. Open the Vercel project above. Set the Git repository to `paleofoundation/foreverchemicalsindex`, root directory to the repository root, install command to `npm ci`, build command to `npm run build`, and output directory to `public`. No environment variables are required for the static site.
2. Set `git.deploymentEnabled` to `true` in `vercel.json` if pushes to the production branch should deploy, or run a manual production deploy (`target: production`) of this commit. A preview deployment with `target: null` will not replace the public host.
3. Add the domain `foreverchemicalsindex.com` to that project and point DNS at Vercel (apex and `www`, if used). The domain is not attached today.
4. Confirm `https://foreverchemicalsindex.com/` serves this index, `https://foreverchemicalsindex.com/robots.txt` allows crawling and names the sitemap, and a category page such as `/products/eggs-product` is not a 404.

Do not add analytics identifiers, search-console tokens, or credentials to the repository as part of that cutover.
