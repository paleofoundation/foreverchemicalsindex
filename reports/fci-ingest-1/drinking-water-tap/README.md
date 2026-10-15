# FCI-INGEST-1: drinking-water-tap

Base: origin/fci-scaffold-1, 9832914da3d252c397fabdc16b02498cb50e7846.

Filed 33 full-PDF source pages. NOT_FILED: one PDF with unverifiable article DOI and three XML records. The source template supports method, review and source-water context; these context records emit no finished tap-water concentrations. 143 selected source records, all HOLD; 25 mismatch/limitation entries. These are records, not independent samples or studies.

The complete staged packet is copied under raw/fci-ingest-1/drinking-water-tap, with original hashes and controls intact. No remote sources were accessed. The approved new tap-water category stub is added only in this branch, now that sources are filed. Existing public analyte pages remain unchanged.

The scaffold prohibits unapproved findings. All source pages therefore retain draft:true, evidence_tier:pending and findings:[], with held_findings plus source-body tables for review. Source-linked draft product/analyte pages are under wiki/drafts/drinking-water-tap. They are excluded from public output and public datasets remain empty. Audits are unchanged.

SOURCE-DISPOSITIONS.csv accounts for every MANIFEST row; NON-PDF-FILES.csv lists controls and XML. HELD-ROWS.csv mirrors source held_findings. MISMATCHES.csv records source conflicts and scopes without modifying source files. The stage _report/MISMATCHES.csv is identical. Numerical values are not repaired or converted; malformed source units, censoring and subgroup limits remain visible. Aggregate sums without a canonical analyte scope are kept source-specific and are not given an invented analyte page.

Cross-cell exact-file and MANIFEST-DOI duplicate search found none. The overlapping household survey used by DeLuca and Boettger is explicitly noted; they are not counted as independent samples. This is selected extraction, not exhaustive result transcription. Full PDFs are available for the remaining results and exact target lists.

Validation logs are stored in validation/. No merge or deployment is authorized.

Validation complete: 38 tests, type checking, generation, all four build-blocking audits, build and built-site audit PASS. The approved tap-water slug is registered in docs/product-slugs.json and linked from the product directory. No audit or test code changed. Root integrity checks confirmed original input copies, draft links, HOLD state, zero public evidence records and the stage report mirror.
