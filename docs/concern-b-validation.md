# Concern B local validation

Parent: Concern A / PR #9 at 41d49f105da9c4e1a8bc5115df4d7b2d2f103a38. Run October 26, 2026 in the isolated owning checkout. This is local technical validation; no GitHub CI is attached or added, no scientific approval and no deployment.

- npm test: 54 passed, zero failed/skipped. A's privacy/discovery/family tests remain intact.
- npm run check: PASS. Initial B optional-frontmatter/unused-variable errors were fixed; no inherited diagnostics remain.
- npm run build: PASS, including the four original blocking audits, existing built-site audit, A public-set audit and new reading-layout audit across all eleven eligible pages. Eleven public policy/navigation URLs and zero findings remain; all 86 scientific leaves and the 93-candidate inventory are unchanged from A.
- HTTP: 218/218 local GET/HEAD responses passed with no Location, including eleven public pages, all 86 private leaf routes (404), both TEST ONLY routes (404 on the public preview), operational/unknown routes (404), and guide/sitemap/exports/reused asset (200).
- Browser: home, empty directory, public data, TEST ONLY detail and TEST ONLY source at each of 1440, 390 and 320 pixels: all fifteen cases have one H1 and document width equal to viewport. Wide tables stay in local scroll regions (272/342 px viewport containers at 320/390); keyboard ArrowRight scrolled the focused fixture table 40 px without body overflow.
- Keyboard: menu Enter/open, Escape/close with focus restored; native modal search input focus, public methodology result, private eggs-product query zero results, modal focus containment, single Escape from the search input closes and returns focus; skip link explicitly focuses main-content; native contents disclosure toggles with Enter. Footer links and masthead links were checked for contrast; inherited footer selector conflicts were corrected. Temporary viewport overrides were reset.
- Synthetic detail/source fixtures are conspicuously TEST ONLY, outside public/ and absent from public search/sitemaps. The portable QA renderer uses the same components, stylesheet and postscript on a separate local fixture server; no publication guard or policy is weakened.
- git diff --check: PASS. No dependency/lockfile, CI, source evidence, review state, candidate policy, source metadata or deployment configuration change.

Browser artifacts and receipts are saved in this runner's outputs/fci-concern-b-screenshots and work/fci-b-browser.json; tests/type/build/HTTP logs are work/fci-b-tests.txt, fci-b-typecheck.txt, fci-b-build.txt and fci-b-http.json. Local preview servers are stopped before handoff.

All 77 source records / 661 held findings / 94 mismatch entries / four separate method-limit records remain HOLD in the existing ingest drafts. The reported 40 missing acquisitions remain UNVERIFIED. Concern C waits for Elon PASS on B under the 10:46 order. Receiver OFF. No merge, deploy/publish, credentials, DNS, production data or outbound messages.
