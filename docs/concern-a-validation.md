# Concern A validation

Baseline: FCI scaffold 9832914da3d252c397fabdc16b02498cb50e7846; dependency PR #1. No evidence-ingest branch was merged or copied. Run October 26, 2026 in the owning runner's isolated checkout.

- Locked npm ci: PASS; browser binary download skipped. No dependency/lockfile change.
- npm test: 54 passed, 0 failed, 0 skipped. Includes the original baseline plus synthetic policy/family/scope/HOLD/privacy and stale-output cases. The initial sandbox tsx IPC denial was resolved with ordinary local execution permission; no runner/auth workaround.
- npm run check: PASS, no inherited diagnostics.
- Four original blocking audits: PASS.
- npm run build and built-site audit: PASS; 98 Markdown inputs, 87 filtered (86 scientific leaves plus private template), 21 emitted build files before metadata postprocessing. Sass import deprecation notices are non-failing inherited warnings.
- New public-set audit: PASS, 11 public policy/navigation pages, zero public source pages, zero findings. HTML, search, guide and sitemap eligible sets agree; answer excerpts exclude private records; JSON and CSV agree. Scholarly sitemap empty.
- Local serve-handler HTTP: 212/212 GET/HEAD responses passed, including 11 eligible pages (200), all 86 private scientific leaf routes (404), private/template/tag/unknown paths (404), and public guide/sitemap/exports (200). No Location headers; temporary loopback server closed.
- git diff --check: PASS. All 73 product and 13 analyte leaf files remain byte-identical to the scaffold. Only generated product/analyte directory lists lose private links.

The initial new audit detected Quartz's automatic tags/index output and a root-guide URL-normalization bug; both were corrected, then the complete checks above passed. These technical results do not approve scientific claims. Production PFAS policy remains proposed/unvalidated and profile publication remains disabled. All existing 77 sources / 661 held findings / 94 mismatches / four separate method limits remain HOLD in their existing drafts; the missing-file queue count 40 is UNVERIFIED. B and C wait for Elon PASS on A. No merge, deployment, credentials, DNS, production or outbound action occurred.
