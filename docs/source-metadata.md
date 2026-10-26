# Source metadata and public evidence contract

All generators consume the same eligible public set. Bibliographic metadata never establishes scientific review, profile eligibility, or approval. The A review/provenance gate and proposed inactive profile policy are unchanged. This branch has 11 public reference/navigation pages, zero public source pages and zero published findings. Private intake counts and held rows are not public coverage counts.

## Work and page types

Each canonical index page has its own WebPage (or CollectionPage for section directories), distinct from the external work described by a source page. Organization, WebSite and BreadcrumbList metadata are retained. The Data page describes the existing evidence export as a Dataset, with actual JSON and CSV distributions and an explicit empty-evidence explanation. No license, concentration, date, creator of an original study, or scientific review is inferred.

| Verified source_type | External work type | Publication metadata |
| --- | --- | --- |
| journal-article / peer-reviewed-article | ScholarlyArticle | Periodical and citation_journal_title from verified publication |
| government-report / technical-report | Report | No journal assertion |
| dataset | Dataset | No journal assertion |
| legislation | Legislation | No journal assertion |
| unknown / primary_measurement / other | CreativeWork | No inferred scholarly status |

Underscore spellings are normalized to hyphens. Existing intake `primary_measurement` describes evidence function, not publication genre; it does not prove a journal article.

The mapping follows [Schema.org Report](https://schema.org/Report), [author](https://schema.org/author), and [Dataset](https://schema.org/Dataset). It is a local metadata contract, not search-engine indexing or rich-result acceptance.

## Bibliographic fields

Eligible sources already require verified title, authors, year, publication, access URL, DOI or explicit no-DOI disposition, provenance and review. Unknown optional fields are omitted. No blanket no-DOI assertion is added.

| Field | Output |
| --- | --- |
| title | work.name, citation_title; headline only on ScholarlyArticle |
| authors | repeated citation_author; names alone do not imply a Person |
| author_entities | optional verified `{name, type}` list; Person/Organization only, matching authors exactly; no inferred affiliation |
| issuing_body | optional verified organization name matching authors; overrides a conflicting Person entity for that issuer |
| year | datePublished and citation_publication_date, year precision preserved |
| publication | Periodical/citation_journal_title only for explicit journal genres |
| doi | PropertyValue DOI and citation_doi only when verified and supplied |
| access_url | sameAs; not automatically asserted to be full-text HTML, a PDF, or redistributable |
| canonical source page | citation_abstract_html_url, distinct from the original work's access URL |

Author entities and issuing-body fields require the same identity/provenance review as the rest of the bibliography. If entity type is unknown, JSON-LD author is omitted while bibliographic citation_author names remain. No person, publisher, affiliation, license, CAS, review date, identifier or original-work rights are fabricated. A government issuer is emitted as Organization only when explicitly identified.

## References, Sources, coverage and history

`static/public-evidence.json` contains only eligible public pages and sources. References are unique source links explicitly present in page body text, in first-citation order; comment/code examples and unused link definitions are excluded by Markdown parsing. Supported links are root-qualified wiki source links and Markdown source links, including relative, reference-style, and first-party absolute links. Unapproved source targets never enter this apparatus; the existing link audit separately rejects dangling public citations.

Sources are eligible source records with an explicit routing association to that product, analyte, regulation or regulator profile. Routing is not a citation and does not establish support for every claim. Generated References/Sources sections appear only for nonempty eligible lists and do not duplicate an existing heading ID. Current public policy pages do not receive empty scientific apparatus.

Coverage reports cited-source, routed-source and published-finding counts independently. It does not deduplicate scientific families, count the private intake, or claim completeness. Findings preserve the existing seven-column CSV and equivalent JSON/table records. No held_findings are exported. The proposed discovery policy remains responsible for family eligibility.

Revisions are an explicit empty list with `no-reviewed-revision-records`. A future reviewed correction schema is required before populating it. Git commits, builds, timestamps and arbitrary frontmatter history are not promoted as editorial history. Errata remains the public correction location; no revision event was invented by this implementation.

## Discovery and validation

The guide lists each eligible canonical page once and explains source citation, correction location, empty exports and PFAS distinctions. Robots contains the sitemap and a comment pointing to llms.txt (the comment is not a crawler directive). No contact address is invented; About supplies the existing institutional context. The legacy sitemap-scholarly.xml retains all eligible source pages as a compatibility source-discovery surface; its filename does not change their source-type schemas.

Postbuild metadata removes its previous output before insertion. The blocking audit parses every JSON-LD script and citation tag, checks the exact expected graph and citation values, exactly one canonical/OG URL per public page, valid breadcrumb destination, advertised distributions, eligible coverage parity, robots pointer, and no evidence/canonical/OG URL on the noindex 404. The existing public-set audit independently checks HTML/search/answer/sitemap/guide/findings parity. Synthetic tests are labeled TEST ONLY and never enter the production build.
