# FCI discovery and publication contract v1

Concern A of FCI-BUILD-1. Baseline: scaffold PR #1 at 9832914da3d252c397fabdc16b02498cb50e7846. This change adds guards, not scientific acceptance. Existing ingest PRs #2–#8 remain separate HOLD drafts: 77 source records, 661 held findings, 94 mismatch rows and four additional plastic-method limits, with zero public findings. No raw/source records are imported by this change.

## Proposed policy is inactive

`tools/lib/discovery-policy.mjs` versions the proposal as `fci-discovery/1-proposed`: ingredient 3, product 2, analyte 2 independent exact-scope measured families. These are proposed operational triage minima, not validated PFAS thresholds or accepted governance. `review_state: proposed` and `profile_publication_enabled: false` prevent every scientific profile from becoming READY under the production configuration, even when a record claims review approval. Activation requires a separately reviewed policy change and actual evidence/type/identity/review checks; do not toggle it to satisfy a page count. Tests inject an explicitly SYNTHETIC accepted policy into the pure evaluator only; they do not change production policy or claim human approval.

One independently sampled study/cohort or primary dataset is one family regardless of paper/row count. The source's reviewed `evidence_family` identity deduplicates papers. Citation-only, reviews, method context and unsupported scope count zero. Exact scope and destination type must match; food, finished product, matrix, physical format and preparation cannot borrow results from one another. All declared source/row metadata remains subject to primary-source review; the compiler does not perform that review.

## Private identities and page types

`data/discovery/candidates.json` preserves 73 product and 13 analyte scaffold identities plus seven approved extra scope identities. It is an internal inventory, not a public table or automatic acceptance feed. `declared_type` preserves the inherited classification; `type_review: pending` records that it is not endorsed. A single food/raw material belongs to ingredients; manufactured or regulated goods belong to products; ambiguous milk, water and formula scopes require exact row-fit classification before a canonical move. Do not create ingredient pages by renaming inherited product slugs or copying their findings.

Source-backed private routing stubs may exist before a public profile. The October 15 slug answer is recorded in NEEDED-SLUGS.md. The 86 original Markdown leaves are retained byte-for-byte and removed from public HTML, directories, search, sitemaps and exports. The eleven policy/navigation pages remain. Hubs list eligible records only. Unknown page families and operational paths fail closed; new page-family publication needs an explicit contract. Generated tag pages are disabled because they bypass the explicit public-page registry.

The missing-file queue is a separate unresolved input: reported_count 40, status UNVERIFIED, actual queue_path unknown. Never turn that into zero, infer it from mismatch/control counts, or invent replacement retrieval lines.

## Source review and findings

A source record requires explicit approved_for_public review state, a matching review_record (id, disposition and primary source hash), verified identity/provenance, valid primary SHA-256, reviewed A/B evidence class, citation identity and bibliographic fields. Draft, pending, duplicate and HOLD states independently exclude it. A tier, DOI or hash alone never grants publication. Atomic source pages require actual source review independently of the still-disabled multi-source profile policy. Actual source records in the existing drafts lack acceptance and remain excluded.

For a profile, the pure evaluator additionally requires verified type/scope identity, clear overlap, independent exact-scope primary measurement families, reviewed question coverage and a profile review record tied to the accepted policy version. Runtime publication derives source support from canonical source records, not a profile's claimed source count. Production policy remains proposed, so no profile qualifies.

A usable occurrence row requires scope_id, destination_type, analyte, original value/unit/basis, source_location, statistic, method, exact matrix_fit and format_fit, occurrence evidence_kind and explicit result_status. Allowed measurement kinds are targeted-pfas and defined-organic-fluorine; the latter requires aggregate_definition. Total/inorganic fluorine, migration, exposure estimates and method limits cannot qualify occurrence. Non-detects preserve their source representation and censoring, never zero. Derived results require separate review and are not accepted by this contract. No new scientific numeric value, conversion, ceiling, identifier or date is supplied here.

## One publication boundary

`isPublicWikiRecord` is shared by the Quartz filter and Node generators. The same source context is read from canonical Markdown for both. The existing findings/routing/provenance/firewall audits remain blocking. Directory generation uses only eligible pages. The postbuild public-set audit compares emitted HTML (except the actual 404 document), search, primary/scholarly sitemap, llms links and evidence exports against the eligible source set, rejecting stale or extra output. Internal draft/private attachment paths are also ignored by Quartz, not merely hidden from search. Publication is exclusion, not noindex-only privacy.

Concern A deliberately retains the current design and existing metadata mappings. B and C require Elon's PASS on A under the October 26 09:56 order. No merge, deploy, credentials, DNS or production operation is authorized by this contract. Expected public sitemap change: 97 to 11 navigation/policy URLs, zero scientific leaves, zero source pages and zero findings. This is truthful eligibility, not scientific completion.
