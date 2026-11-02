import test from "node:test"
import assert from "node:assert/strict"
import { getShareContent } from "./share"

const canonicalUrl = "https://foreverchemicalsindex.com/synthesis/metal-ecology"

test("authored share copy and normalized hashtags reach X and the copied post intact", () => {
  const content = getShareContent({
    canonicalUrl,
    frontmatter: {
      title: "A scholarly title",
      shareText: "Could metals reshape microbial ecology? A framework, not a clinical conclusion.",
      socialDescription: "The less specific fallback.",
      shareHashtags: ["#Microbiome", "#Heavy Metals", "microbiome", "Food_Safety!", "Extra"],
    },
  })
  assert.deepEqual(content.hashtags, ["Microbiome", "HeavyMetals", "Food_Safety"])
  assert.equal(
    content.text,
    "Could metals reshape microbial ecology? A framework, not a clinical conclusion.",
  )
  assert.equal(
    content.post,
    `${content.text}\n${canonicalUrl}\n#Microbiome #HeavyMetals #Food_Safety`,
  )
  const intent = new URL(content.xUrl)
  assert.equal(intent.origin + intent.pathname, "https://twitter.com/intent/tweet")
  assert.equal(intent.searchParams.get("text"), content.text)
  assert.equal(intent.searchParams.get("url"), canonicalUrl)
  assert.equal(intent.searchParams.get("hashtags"), "Microbiome,HeavyMetals,Food_Safety")
})

test("fallback copy observes editorial priority and tolerates missing or non-text metadata", () => {
  const candidates = {
    socialDescription: "Social.",
    description: "Description.",
    dek: "Dek.",
  }
  const share = (frontmatter: Record<string, unknown>) =>
    getShareContent({ canonicalUrl, frontmatter, description: "Generated." }).text
  assert.equal(share(candidates), "Social.")
  assert.equal(share({ ...candidates, socialDescription: " " }), "Description.")
  assert.equal(share({ ...candidates, socialDescription: false, description: null }), "Dek.")
  assert.equal(share({ title: "Title" }), "Generated.")
  assert.equal(getShareContent({ canonicalUrl, frontmatter: { title: "Title" } }).text, "Title")
  assert.equal(getShareContent({ canonicalUrl }).text, "Forever Chemicals Index")
})

test("prose cleanup preserves scientific notation while unwrapping links, markup, and entities", () => {
  const { text } = getShareContent({
    canonicalUrl,
    frontmatter: {
      shareText:
        "<p>**[[metals/arsenic-inorganic|Inorganic arsenic]]** &amp; [methylmercury](https://example.com/a_(b)) are distinct.</p><p>Cr<sup>VI</sup> is &lt; 2 &micro;g/kg; [[metals/lead]] is separate.</p>",
      shareHashtags: [],
    },
  })
  assert.equal(
    text,
    "Inorganic arsenic & methylmercury are distinct. CrVI is < 2 µg/kg; lead is separate.",
  )
})

test("generated descriptions omit their opening display label while authored copy remains authoritative", () => {
  for (const label of ["Quick read", "Overview", "Abstract:"]) {
    const description = `${label} Lead is treated differently from most dietary contaminants.`
    assert.equal(
      getShareContent({ canonicalUrl, description }).text,
      "Lead is treated differently from most dietary contaminants.",
    )
    assert.equal(
      getShareContent({ canonicalUrl, frontmatter: { shareText: description } }).text,
      description,
    )
  }
  assert.equal(
    getShareContent({
      canonicalUrl,
      description: "Overview of metal exposure.",
    }).text,
    "Overview of metal exposure.",
  )
})

test("an explicit empty hashtag array opts out in every sharing format", () => {
  const content = getShareContent({
    canonicalUrl,
    slug: "microbiome/overview",
    frontmatter: { title: "Microbiome", shareHashtags: [] },
  })
  assert.deepEqual(content.hashtags, [])
  assert.equal(content.post, `Microbiome\n${canonicalUrl}`)
  assert.equal(new URL(content.xUrl).searchParams.has("hashtags"), false)
})

test("default hashtags follow conservative page taxonomy", () => {
  for (const [slug, frontmatter, expected] of [
    ["microbiome/overview", {}, ["Microbiome", "HeavyMetals"]],
    [
      "synthesis/framework",
      { title: "Metal exposure and microbial ecology" },
      ["Microbiome", "HeavyMetals"],
    ],
    ["health/ecology", { tags: ["microbiome"] }, ["Microbiome", "HeavyMetals"]],
    ["sources/paper", { type: "microbiome" }, ["Microbiome", "HeavyMetals"]],
    ["metals/lead", { type: "metal", symbol: "Pb" }, ["Lead", "HeavyMetals"]],
    ["metals/cadmium", {}, ["Cadmium", "HeavyMetals"]],
    ["food", { type: "ingredient" }, ["FoodSafety", "HeavyMetals"]],
    ["products/cereal", {}, ["ProductSafety", "HeavyMetals"]],
    ["products/cosmetics", {}, ["ProductSafety", "HeavyMetals"]],
    ["regulations/fda", {}, ["Regulation", "HeavyMetals"]],
    ["regulations/product-safety", {}, ["Regulation", "HeavyMetals"]],
    ["testing/icp-ms", {}, ["AnalyticalChemistry", "HeavyMetals"]],
    ["about", { title: "How we lead evidence reviews" }, ["HeavyMetals"]],
  ] as [string, Record<string, unknown>, string[]][]) {
    assert.deepEqual(getShareContent({ canonicalUrl, slug, frontmatter }).hashtags, expected, slug)
  }
})

test("explicit hashtags are safe, deduplicated, capped at three, and can be a comma-separated string", () => {
  const { hashtags } = getShareContent({
    canonicalUrl,
    frontmatter: { shareHashtags: "#Pb, #pb #FoodSafety; #食品安全 #Fourth" },
  })
  assert.deepEqual(hashtags, ["Pb", "FoodSafety", "食品安全"])
  assert.deepEqual(
    getShareContent({
      canonicalUrl,
      frontmatter: { shareHashtags: [42, "", "###", "123", "_", "#Lead"] },
    }).hashtags,
    ["Lead"],
  )
})

test("X budgeting reserves the canonical URL and hashtags before accepting authored copy", () => {
  const accepted = getShareContent({
    canonicalUrl,
    frontmatter: { shareText: "a".repeat(243) },
  })
  assert.equal(accepted.text.length + 1 + 23 + 1 + "#HeavyMetals".length, 280)
  assert.throws(
    () =>
      getShareContent({
        canonicalUrl,
        slug: "synthesis/important-caveat",
        frontmatter: { shareText: "a".repeat(244) },
      }),
    /synthesis\/important-caveat.*shareText.*244\/243.*will not be truncated/,
  )
})

test("Unicode copy uses NFC and conservative weighted counts instead of UTF-16 length", () => {
  const text = `Evidence ${"e\u0301".repeat(115)}.`
  assert.equal(
    getShareContent({ canonicalUrl, frontmatter: { shareText: text } }).text,
    `Evidence ${"é".repeat(115)}.`,
  )
  assert.throws(
    () =>
      getShareContent({
        canonicalUrl,
        frontmatter: { shareText: "界".repeat(122) },
      }),
    /244\/243/,
  )
})

test("short embedded URLs reserve X's full URL cost in authored and fallback copy", () => {
  for (const url of ["x.co", "https://x.co", "www.x.co", "例子.中国"]) {
    const fitting = `${"a".repeat(219)} ${url}`
    assert.equal(
      getShareContent({ canonicalUrl, frontmatter: { shareText: fitting } }).text,
      fitting,
    )
    assert.throws(
      () =>
        getShareContent({
          canonicalUrl,
          frontmatter: { shareText: `a${fitting}` },
        }),
      /244\/243/,
    )
    assert.equal(
      getShareContent({
        canonicalUrl,
        description: `a${fitting}`,
        frontmatter: { title: "Evidence" },
      }).text,
      "Evidence",
    )
  }
})

test("oversized fallback descriptions retain whole opening sentences only", () => {
  const first = "Metals can alter microbial ecology."
  const second = "The framework remains a hypothesis requiring clinical validation."
  const { text } = getShareContent({
    canonicalUrl,
    description: `${first} ${second} ${"Further evidence is needed ".repeat(20)}.`,
  })
  assert.equal(text, `${first} ${second}`)
})

test("a long opening sentence or unfinished clause falls back to the title", () => {
  for (const description of [
    "Very long observations ".repeat(30) + ".",
    "Incomplete claims ".repeat(30),
  ]) {
    assert.equal(
      getShareContent({
        canonicalUrl,
        description,
        frontmatter: { title: "Microbial metal ecology" },
      }).text,
      "Microbial metal ecology",
    )
  }
})

test("long title fallback truncates at a word boundary with an explicit omission", () => {
  const { text } = getShareContent({
    canonicalUrl,
    frontmatter: { title: "Evidence about microbial ecosystems ".repeat(20) },
  })
  assert.match(text, /\b(?:Evidence|about|microbial|ecosystems)…$/)
  assert.equal(text.includes("\uFFFD"), false)
  assert.ok(Array.from(text).reduce((sum, c) => sum + (c.codePointAt(0)! <= 127 ? 1 : 2), 0) <= 231)
})

test("title truncation keeps complete emoji graphemes and never emits a broken surrogate", () => {
  const { text } = getShareContent({
    canonicalUrl,
    frontmatter: { title: "👩‍🔬".repeat(100), shareHashtags: [] },
  })
  assert.match(text, /^(?:👩‍🔬)+…$/)
  assert.doesNotThrow(() => encodeURIComponent(text))
})

test("oversized hashtags fail visibly instead of leaving an unusable share control", () => {
  assert.throws(
    () =>
      getShareContent({
        canonicalUrl,
        slug: "bad-tags",
        frontmatter: { shareHashtags: ["Tag".repeat(100)] },
      }),
    /bad-tags.*shareHashtags/,
  )
})

test("the supplied canonical URL is encoded once and shared without a browser location dependency", () => {
  const canonical = "https://foreverchemicalsindex.com/testing/arsenic?mode=full&basis=dry#method"
  const content = getShareContent({
    canonicalUrl: canonical,
    frontmatter: { title: "Arsenic & method selection" },
  })
  assert.equal(new URL(content.xUrl).searchParams.get("url"), canonical)
  assert.equal(new URL(content.xUrl).searchParams.get("text"), "Arsenic & method selection")
  assert.ok(content.post.includes(`\n${canonical}\n`))
})
