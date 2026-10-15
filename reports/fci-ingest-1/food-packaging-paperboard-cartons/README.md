# FCI-INGEST-1 paperboard batch review

This cell reviews 25 deposited PDFs and lists one XML without filing it as a source. It files 22 draft source pages: 16 with selected measurements and six with context only. Three PDFs are NOT_FILED for matrix or measurement scope; all 26 manifest rows have dispositions.

The 70 selected source records remain HOLD. They are not independent product counts and are not a complete transcription of all tables. The draft product table and nine draft analyte tables read those source records. Public product/analyte stubs stay unchanged and public findings remain empty. Adjacent paper, molded fibre, feedstock, simulant and landfill-gas measurements retain their matrix; they are not assigned a carton-specific food concentration. TF has no organic-fluorine analyte route. EOF rows use the organic-fluorine review hub with an explicit extraction scope.

Source PDFs and intake controls are byte-identical copies under raw/fci-ingest-1/food-packaging-paperboard-cartons. Non-PDF inputs and unavailable supplementary tables do not supply measurement rows. The Lieu PDF has no printed DOI; its manifest DOI is preserved separately, doi remains null, and no_doi_assigned remains false. No assertion of external DOI resolution is made.

MISMATCHES.csv records unresolved identity, document-type, unit, limit and abstract/table conflicts. Its stage _report copy is byte-identical. DUPLICATE_CHECK.json records no exact PDF hash or manifest DOI duplicates across the seven cells; secondary literature reuse is excluded from new measurements. No numerical conflict was corrected in the source.

Visual QA inspected rendered table pages for Hsu, Chen, Ye, Simonetti, Schwartz-Narbonne, Lieu, Siao, White, Encarnacion, Schaider, Jovanović, Hauschildt, Nxumalo, Minh and Schultes. Method and contextual portions were read from complete relevant pages. No graph values were digitized. Local report logs capture all tests, TypeScript check, four build-blocking audits and build. Scientific HOLD is separate from successful software checks.

Validation complete: 38 tests passed, TypeScript passed, all four build-blocking audits passed, build and built-site audit passed. Public evidence export contains zero records and no draft source page is emitted. Build warnings concern untracked-file dates before commit only.
