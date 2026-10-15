# Source contract

The private source template preserves the HMI provenance fields. Required changes remove example identities, dates, DOI, hash, metal data, certification prose, and forbidden punctuation. `no_doi_assigned`, `analytes`, and `findings` make the empty PFAS contract explicit. This is an intentional exception to byte-for-byte template copying under the order's hard rules.

Only reviewed, non-draft sources are published. Each source requires a verified DOI or `no_doi_assigned: true`, a retrievable access URL, title, authors, publication, and verified publication year. Do not infer absent fields.

| Frontmatter | Generated metadata |
| --- | --- |
| title | citation_title, ScholarlyArticle.headline |
| authors | repeated citation_author, ScholarlyArticle.author |
| year | citation_publication_date, ScholarlyArticle.datePublished |
| publication | citation_journal_title, ScholarlyArticle.isPartOf |
| doi | citation_doi, ScholarlyArticle.identifier, only when supplied |
| access_url | citation_fulltext_html_url, ScholarlyArticle.sameAs |

The index source page canonical remains on foreverchemicalsindex.com. Metadata describes the external work, with no invented authorship or publication details.

Findings live in source frontmatter as a `findings` array. Every entry requires `product` (slug), `analyte` (slug), `value` (source-reported string), `unit`, `basis`, and `source_location` (page or table reference). Source key is derived from the containing page. Product and analyte declarations must include each finding destination. Draft or pending sources cannot emit findings. This scaffold ships without any finding or source record.
