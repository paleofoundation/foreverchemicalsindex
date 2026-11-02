# Concern B: shared reading structure

Stacked on Concern A / PR #9, exact parent 41d49f105da9c4e1a8bc5115df4d7b2d2f103a38. HMI/MPI provide the retained Lora/Inter/IBM Plex Mono palette, home paper-ledger geometry, full-width research masthead, navigation, reading columns, evidence tables and grouped footer. No scientific content is borrowed.

The home reports actual eligible source/measurement counts (currently zero), without invented authors, review dates, study totals or findings. The header has a responsive keyboard-operated menu and native modal search over public contentIndex only. Escape closes the menu or dialog and restores focus. Search uses textContent, not HTML injection, and does not call an external service. Event listeners are aborted on Quartz navigation. The skip link targets the focusable main. Native details provides section navigation, and a reference guide when there are no page sections. Wide tables become named, keyboard-focusable local scroll regions; body width remains the viewport width.

All evidence eligibility, proposed PFAS policy and candidate files from A are unchanged. Eleven public policy/navigation pages remain; all 86 scientific leaves remain private and zero findings are published. Existing 77 source / 661 held findings / 94 mismatch / four separate method-limit records remain HOLD in their sibling drafts. The missing-files count 40 remains UNVERIFIED. Concern C metadata/source apparatus is not implemented. No CI is added; validation is local.

## Retained asset provenance

`wiki/static/research-glassware-notebook-sampling-spoon.webp` is the existing neutral research asset retained in the MPI template port, copied from committed local MPI reference HEAD 638e5c236a9d385335ece97ba9abd072c9e1b227, blob 538836117311b9fea9a90d5af18016db3bb16b4a. SHA-256 d6fe4d9fdbcd0997d7f1e552f5a538f60797d93998f3ed93a5c8abbfee58b127. It is decorative background imagery and establishes no scientific claim. Original dirty human checkouts were read only.

## Reproduce local checks

Run npm test, npm run check and npm run build. The postbuild reading audit checks all eligible pages for exactly one H1, skip/main linkage, menu/dialog labels and fixture exclusion, alongside A's public-set and existing blocking audits. Serve public/ locally with node tools/serve.mjs.

For synthetic detail/source layout QA, run node tools/preview-reading-fixtures.mjs --serve after building. It writes only ignored .quartz-cache/reading-fixtures and serves TEST ONLY fixtures on separate loopback port 8081. The fixtures have no scientific results, invented paper identities, author/date assertions or approvals, and are never copied to wiki/ or public/. Public port 8080 must continue to return 404 for /test-only-detail and /test-only-source. The QA renderer calls the same renderPage/components and loads the production stylesheet/postscript; it does not alter the publication policy. Stop both owned local servers after testing.

The React/Preact component checklist was applied: server-rendered components retain the existing runtime, no new UI framework/dependency, no unnecessary hooks or client data services, semantic controls and accessible names, escaped text, focus restoration, and cleanup of navigation listeners. The design deliberately omits HMI's duplicate headings, retired Direct answer block, commercial/account actions and unsupported evidence highlights.
