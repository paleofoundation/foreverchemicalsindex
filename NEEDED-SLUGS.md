# NEEDED-SLUGS

No destination pages in this list have been created. Exact HMI filenames were checked at aa867b2e63bed583d84663beb4fcf28569c2ff7d.

| Requested scope | Near HMI slug | ASK: options and recommendation |
| --- | --- | --- |
| Tap water | No drinking-water-tap.md in this snapshot; bottled-drinking-water exists | Reuse bottled scope or approve drinking-water-tap. Recommend a new tap-water slug after scope review. |
| Popcorn | No exact product-level match found | Reuse broad food scope or approve popcorn. Recommend popcorn. |
| Fast food | No exact product-level match found | Reuse a broader food scope or approve fast-food. Recommend a new slug after defining the sampling scope. |
| Takeout containers | food-packaging-paperboard-cartons, food-packaging-plastic-tubs | Reuse material-specific pages or approve takeout-containers. Recommend reuse by material where supported. |
| Textiles and outdoor apparel | categories/infant-and-child-durable-goods-and-textiles, blankets-and-sleep-sacks | Reuse infant scope or approve textile and apparel scopes. Recommend new scopes outside infant products. |
| School uniforms | categories/infant-and-child-durable-goods-and-textiles | Reuse the category or approve school-uniforms. Recommend school-uniforms. |
| Carpets and rugs | carpet-cleaners, carpet-spot-removers | Reuse cleaners or approve carpets-and-rugs. Recommend a new material scope. |
| Mattresses | blankets-and-sleep-sacks | Reuse bedding scope or approve mattresses. Recommend mattresses. |

ASK: Elon to select reuse or approve new slugs. Recommendations are pending decisions.

## Decision history (supersedes the pending wording above)

Elon's canonical bridge answer on October 15, 2026 at 10:38 accepted the recommendations. Approved private scope identities: `drinking-water-tap`, `popcorn`, `fast-food` (define its sampling frame), `textiles-outdoor-apparel`, `school-uniforms`, `carpets-and-rugs`, and `mattresses`. Takeout containers reuse the material-specific food-packaging pages.

Create a new private routing stub only when the matching ingest has a filed source. This does not make it a public evidence profile. Tap water is added in existing ingest draft PR #8; this scaffold baseline does not contain that sibling change. The remaining six approved new stubs have no filed source in the inspected drafts. Preserve the original table above as decision history, not eight unanswered questions.

The discovery inventory is `data/discovery/candidates.json`. All entries remain NEEDS-EVIDENCE with type review pending. The reported 40 missing acquisitions remain UNVERIFIED because the exact queue CSV was not available; neither this inventory nor NOT_FILED rows replace that queue.

## Filed pages now on the public index

Ingest added these category pages from filed sources: `breast-milk`, `cereal-grains`, `childrens-products`, `cosmetics`, `drinking-water-tap`, `meat-and-poultry`, `produce-mixed`, `sunscreens`, and `textiles`. They are public catalog pages. They are not a separate ingredient taxonomy, and they are not READY profiles under the proposed discovery policy. Foods stay on the category page until an exact ingredient split exists. `sunscreens` has no transcribed measurements. The others quote source-reported values where the ingest transcribed them, and they mark the rest as gaps.
