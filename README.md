# Forever Chemicals Index

Empty PFAS reference scaffold derived from the HMI Quartz framework at commit `aa867b2e63bed583d84663beb4fcf28569c2ff7d`.

## Local checks

Use the Node and npm versions declared in package.json. Run `npm ci`, `npm test`, `npm run check`, and `npm run build`. The build generates directories and empty exports, runs every required audit as a hard failure gate, compiles the site, emits metadata, and audits rendered links and canonicals.

`npm run serve` serves the built files locally. This scaffold has no application backend, credentials, analytics identifier, or deployment workflow. Repository-triggered deployments are disabled in vercel.json.

## Content

- `wiki/products/`: only verified HMI product slugs, with empty evidence sections.
- `wiki/analytes/`: substances, classes, and aggregate measures with cited terminology and pending identifiers.
- `wiki/sources/`: private authoring template and empty directory, no source records.
- `wiki/regulations/` and `wiki/regulators/`: empty directories with navigable index pages.
- `NEEDED-SLUGS.md`: pending taxonomy decisions, no pages created.
- `docs/source-metadata.md`: source provenance and generated citation metadata contract.
- `docs/scaffold-report.md`: provenance, adaptations, checks, and known limitations.

Generated evidence exports have no records. Empty data is not a concentration, absence claim, or safety finding. All scientific ingest remains future work.
