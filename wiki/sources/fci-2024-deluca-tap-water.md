---
{
  "draft": false,
  "type": "source",
  "cite_key": "fci-2024-deluca-tap-water",
  "title": "Per- and polyfluoroalkyl substances (PFAS) in paired tap water and house dust from United States homes",
  "authors": [
    "Nicole M. DeLuca",
    "Jason Boettger",
    "Kelsey E. Miller",
    "Christopher Fuller",
    "Jeffrey M. Minucci",
    "Peter J. Ashley",
    "David Cox",
    "Gary DeWalt",
    "Warren Friedman",
    "Eugene A. Pinzer",
    "Karen D. Bradham",
    "James McCord",
    "Elaine A. Cohen Hubal"
  ],
  "year": 2024,
  "publication": "Indoor Environ.",
  "doi": "10.1016/j.indenv.2024.100033",
  "no_doi_assigned": false,
  "source_type": "primary_measurement",
  "evidence_tier": "reviewed",
  "evidence_fitness": "primary_measurement",
  "public_evidence_label": "Source-reported measurements",
  "review_state": "approved_for_public",
  "confidence": "reviewed",
  "claim_classes": [
    "occurrence"
  ],
  "raw_path": "raw/fci-ingest-1/drinking-water-tap/2024_DeLuca_per-and-polyfluoroalkyl-substances-pfas-in.pdf",
  "sha256": "29a6ae17ad38acfe30cddcc6a1e02396b4388cb601b8505198ddae45a3116be2",
  "access_date": "2026-10-15",
  "access_url": "https://pmc-oa-opendata.s3.amazonaws.com/PMC11964114.1/PMC11964114.1.pdf",
  "license": null,
  "metals": [],
  "analytes": [
    "pfoa",
    "pfos"
  ],
  "ingredients": [],
  "products": [
    "drinking-water-tap"
  ],
  "jurisdictions": [],
  "superseded_by": null,
  "updated": "2026-10-15",
  "findings": [],
  "held_findings": [
    {
      "analyte": "pfoa",
      "reported_analyte": "PFOA",
      "value": "0.83",
      "unit": "ng/ < L",
      "basis": "median in residential tap water; unit is malformed in source prose, preserved without repair",
      "source_location": "PDF p10, section 3.1, paragraph beginning The chemicals with the highest median",
      "detection_limit": "PFOA water MRL 0.75 and LOD 0.44 ng/L; PFOS water MRL 1.09 and LOD 0.46 ng/L, PDF p30 Table 1.",
      "confidence": "HOLD",
      "record_id": "FCI-TAP-0009",
      "product": "drinking-water-tap",
      "source": "sources/fci-2024-deluca-tap-water",
      "source_sha256": "29a6ae17ad38acfe30cddcc6a1e02396b4388cb601b8505198ddae45a3116be2"
    }
  ],
  "metadata_location": "PDF p1, title, author byline, journal citation or masthead, and DOI.",
  "manifest_citation": "DeLuca NM, Boettger J, Miller KE et al. (2024). Per- and polyfluoroalkyl substances (PFAS) in paired tap water and house dust from United States homes. Indoor Environments, vol. 1, no. 3, pp. 100033. doi:10.1016/j.indenv.2024.100033",
  "manifest_tier": "PRIMARY",
  "manifest_doi": "https://doi.org/10.1016/j.indenv.2024.100033",
  "matrix_scope": "Paired household tap water and dust. Only water medians are transcribed; dust concentrations use a different matrix and basis.",
  "analyte_scope": "Selected measured analytes are identified in the held table; full target or screening scope is in the cited PDF methods/table. Context-only records make no measurement claim.",
  "method": "SPE-UPLC-MS analysis, PDF pp4-6; target scope in Table 1. The PDF specifies UPLC-MS, so the MANIFEST targeted-method label is not expanded to a different assay.",
  "detection_limits": "PFOA water MRL 0.75 and LOD 0.44 ng/L; PFOS water MRL 1.09 and LOD 0.46 ng/L, PDF p30 Table 1.",
  "source_reported_rows": [
    {
      "product": "drinking-water-tap",
      "analyte": "pfos",
      "value": "0.96",
      "unit": "ng/L",
      "basis": "median in residential tap water",
      "source_location": "PDF p10, section 3.1, paragraph beginning The chemicals with the highest median",
      "limits": "PFOA water MRL 0.75 and LOD 0.44 ng/L; PFOS water MRL 1.09 and LOD 0.46 ng/L, PDF p30 Table 1."
    }
  ]
}
---

# Per- and polyfluoroalkyl substances (PFAS) in paired tap water and house dust from United States homes


## Summary

Paired household tap water and dust. Only water medians are transcribed; dust concentrations use a different matrix and basis.



## Key numbers

Source-reported values checked against the cited page of the filed PDF. Values are reported as printed, without conversion. These are selected records, not an exhaustive transcription.

| analyte | value | unit | basis | source location | limits and qualifiers |
| --- | --- | --- | --- | --- | --- |
| [[analytes/pfos]] | 0.96 | ng/L | median in residential tap water | PDF p10, section 3.1, paragraph beginning The chemicals with the highest median | PFOA water MRL 0.75 and LOD 0.44 ng/L; PFOS water MRL 1.09 and LOD 0.46 ng/L, PDF p30 Table 1. |

1 further transcribed values remain under review and are not shown.

## Evidence Fitness

Source classification: primary_measurement. MANIFEST tier: PRIMARY. This is a selected, bounded transcription, not an exhaustive extraction of every result in the paper. Each selected number has its own PDF page or table locator. Values for different matrices, isomers, statistics and aggregate assays are not interchangeable.


## Methods (brief)

SPE-UPLC-MS analysis, PDF pp4-6; target scope in Table 1. The PDF specifies UPLC-MS, so the MANIFEST targeted-method label is not expanded to a different assay.

Detection limits and censoring: PFOA water MRL 0.75 and LOD 0.44 ng/L; PFOS water MRL 1.09 and LOD 0.46 ng/L, PDF p30 Table 1.


## Limitations


- PRINTED_UNIT_CONFLICT: PFOA median prose prints ng/ < L. Comparison: Table 1 water reporting-limit context uses ng/L. Locator: PDF p10 narrative; p30 Table 1; rendered p10 verified. Preserve malformed prose unit with PFOA value; no unit repair. PFOS retains its printed ng/L unit.


## Provenance notes

Citation metadata verified against PDF p1, title, author byline, journal citation or masthead, and DOI.. Article DOI appears in the supplied PDF and matches the MANIFEST case-insensitively. Original file: `2024_DeLuca_per-and-polyfluoroalkyl-substances-pfas-in.pdf`. SHA-256: `29a6ae17ad38acfe30cddcc6a1e02396b4388cb601b8505198ddae45a3116be2`. Original MANIFEST remains in the copied packet; discrepancies are listed without modifying it. Commercial analyte synonyms, instrument brands and manufacturer names are generalized in authored index prose.


## Wiki pages updated on ingest

[[products/drinking-water-tap]]

[[analytes/pfoa]]

[[analytes/pfos]]
