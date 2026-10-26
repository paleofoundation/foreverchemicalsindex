# Concern C validation

Concern C is stacked on exact B `fd72f06173c34642b943803ecad4b371baf28363` / PR10, branch `codex/fci-build-1-reading-layout`. The local 11:45 checkpoint was saved for the VLE release priority, then resumed in the same runner after CONDUCTOR returned the sole slot. This document describes the final implementation, not a release or scientific approval.

## Result

Source metadata now separates canonical index WebPage/CollectionPage records from the described work: ScholarlyArticle only for explicit journal genres, Report for government/technical reports, Dataset/Legislation when explicitly declared, otherwise CreativeWork. Explicit author entities must match verified bibliographic names; an identified issuer is Organization and is deduplicated. Unknown author entity types, identifiers, dates, affiliations, licenses and full-text formats are not inferred. The 404 retains noindex and omits canonical, Open Graph URL, citation tags and evidence schemas.

Robots points to the extended guide. The Data page links actual JSON/CSV distributions plus public-evidence.json. That coverage export separates body References, routed Sources, finding counts and an empty reviewed-revision state. Markdown parsing excludes code/comments/unused definitions and resolves actual relative/reference citations. Nonempty apparatus is escaped, eligible, unique and idempotent; it never creates empty scientific sections or duplicate References/Sources heading IDs. No revision dates/events are invented.

## Local checks

- 69 tests passed; zero failures, skips or cancellations. Includes independent draft/HOLD/pending/unreviewed exclusion, source genre/entity semantics, unknown metadata, stale citation removal, malformed/duplicate issuer entries, fenced citation examples, actual relative/reference citations, nonempty References generation/idempotence, duplicate heading avoidance, and negative canonical/404/Person/private coverage/apparatus mutations.
- TypeScript: no diagnostics.
- Build plus four original blocking audits, built-site audit, A public-set audit, B reading-layout audit and new metadata audit: PASS. All JSON-LD scripts and citation tags checked across all eleven eligible pages.
- Repeated postbuild: every public file byte-identical. Metadata/coverage/guide outputs contain no build timestamp.
- HTTP: 224/224 GET/HEAD probes PASS. All 86 private scientific leaves, private template/draft/tag/unknown paths, and both TEST ONLY fixture routes return 404 with no Location. GET 404 bodies have no misleading canonical, OG URL or evidence schemas. Public findings JSON is empty, CSV header-only, public coverage totals 0/0 with eleven eligible pages and no private identifiers or invented revisions.
- Browser: changed Data page at 1440/390/320 has one H1, document width equals viewport, and wide table contained locally. Three full-page screenshots saved in task outputs. Native coverage-link click displayed the actual public export. Named table region scrolls 40px with ArrowRight. Viewport reset after verification. B's shared layout/styles/menu/search/skip logic are unchanged; its prior broader interaction receipt remains applicable.

Evidence is local. No GitHub CI was added or claimed; the final handoff records native commit statuses separately. Synthetic fixtures are labeled TEST ONLY, outside the production set, and require no publication-gate exception.

## Boundaries and remaining scientific work

A guard, policy, candidate registry and all 86 scientific leaf files are byte-identical to B. Public output remains eleven navigation/reference pages, zero source pages, zero findings. Profile publication remains disabled under proposed/unvalidated thresholds. Source kinds/entities in future public source pages still require identity/provenance review; this implementation does not approve them.

All 77 sources, 661 held findings, 94 mismatches and four separate method limits remain HOLD in existing ingest drafts. Reported 40 missing files stays UNVERIFIED. No scientific retrieval/import/appraisal/promotion, merge, deploy, DNS, new credential/configuration, production data write or external messaging. VLE's separate unsupported pending-list gate is unchanged by this FCI work.
