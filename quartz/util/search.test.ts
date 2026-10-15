import test from "node:test";
import assert from "node:assert/strict";
import { prepareSearchEntries, searchIndex } from "./search";

const entries = prepareSearchEntries({
  "sources/olive-oil-study": {
    title: "Olive oil metal migration from packaging: a comparative study",
    content: "Olive oil olive oil olive oil lead cadmium olive oil.",
  },
  "ingredients/olives": {
    title: "Olives",
    content: "Olives are the fruit pressed into olive oil.",
  },
  "products/olive-oil": {
    title: "Olive oil",
    content: "Product evidence for olive oil.",
  },
  "ingredients/olive-oil": {
    title: "Olive Oil",
    aliases: ["extra-virgin-olive-oil", "EVOO"],
    tags: ["lead", "cadmium"],
    description: "Evidence on olive oil, processing, and packaging.",
    content: "Olive oil evidence includes migration from ceramic containers.",
  },
  "metals/cadmium": {
    title: "Cadmium (Cd)",
    aliases: ["Cd"],
    content: "Cadmium occurs in olive oil.",
  },
  "testing/icp-ms": {
    title: "Inductively coupled plasma mass spectrometry",
    tags: ["ICP-MS"],
  },
});

test("partial typing immediately ranks the olive oil topic ahead of papers and incidental mentions", () => {
  for (const query of ["oli", "olive", "olive o", "olive oil", "OLIVE-OIL"]) {
    const results = searchIndex(entries, query);
    assert.equal(results[0].slug, "ingredients/olive-oil", query);
    assert.equal(
      results.filter((result) => result.slug === "ingredients/olive-oil")
        .length,
      1,
    );
  }
  assert.equal(searchIndex(entries, "olive oil")[1].slug, "products/olive-oil");
});

test("an exact topic or alias outranks a broad title prefix regardless of source order", () => {
  const documents = prepareSearchEntries({
    "sources/cd-study": { title: "Cd and lead in food" },
    "metals/cadmium": { title: "Cadmium", aliases: ["Cd"] },
    "sources/cadmium-study": {
      title: "Cadmium",
      content: "A source with the same title.",
    },
  });
  assert.equal(searchIndex(documents, "Cd")[0].slug, "metals/cadmium");
  assert.equal(searchIndex(documents, "Cadmium")[0].slug, "metals/cadmium");
  assert.equal(searchIndex(entries, "EVOO")[0].slug, "ingredients/olive-oil");
  assert.equal(
    searchIndex(entries, "extra virgin olive o")[0].slug,
    "ingredients/olive-oil",
  );
});

test("a query may combine title, path, and tag tokens with the final word unfinished", () => {
  assert.equal(
    searchIndex(entries, "lead oli")[0].slug,
    "ingredients/olive-oil",
  );
  assert.equal(searchIndex(entries, "testing icp")[0].slug, "testing/icp-ms");
  assert.equal(searchIndex(entries, "ICP-MS")[0].slug, "testing/icp-ms");
});

test("body-text fallback requires all words and does not reward repetition over a topic title", () => {
  assert.equal(
    searchIndex(entries, "ceramic cont")[0].slug,
    "ingredients/olive-oil",
  );
  assert.equal(
    searchIndex(entries, "migration ceramic")[0].slug,
    "ingredients/olive-oil",
  );
  assert.deepEqual(searchIndex(entries, "ceramic nonexistent"), []);
  assert.equal(
    searchIndex(entries, "olive oil")[0].slug,
    "ingredients/olive-oil",
  );
});

test("word boundaries avoid accidental substrings while the last token allows completion", () => {
  const documents = prepareSearchEntries({
    "ingredients/spoiled-food": {
      title: "Spoiled food",
      content: "Spoiled food.",
    },
    "ingredients/oil": { title: "Oil" },
  });
  assert.deepEqual(
    searchIndex(documents, "oil").map((result) => result.slug),
    ["ingredients/oil"],
  );
  assert.deepEqual(searchIndex(entries, "oliv oil"), []);
});

test("punctuation and Unicode are normalized without treating query text as regular expressions", () => {
  const documents = prepareSearchEntries({
    "sources/gonzalez": { title: "González–Torres: olive oil (2023)" },
    "metals/chromium-vi": { title: "Chromium(VI)", aliases: ["Cr(VI)"] },
    "health/中文": { title: "中文证据" },
  });
  assert.equal(
    searchIndex(documents, "gonzalez tor")[0].slug,
    "sources/gonzalez",
  );
  assert.equal(searchIndex(documents, "Cr(VI)")[0].slug, "metals/chromium-vi");
  assert.equal(searchIndex(documents, "中文")[0].slug, "health/中文");
  for (const query of [
    "",
    "   ",
    ".*+?^${}()|[]\\",
    "[nonexistent]",
    "<script>",
  ]) {
    assert.deepEqual(searchIndex(documents, query), [], query);
  }
});

test("unspaced CJK topics and mixed-script terms remain searchable in production ranking", () => {
  const documents = prepareSearchEntries({
    "health/japanese": { title: "日本語の食品", content: "コントロール条件。" },
    "health/chinese": { title: "食物中的重金属" },
    "health/korean": { title: "식품의 중금속", content: "안녕하세요" },
    "testing/mixed": { title: "これはICP検査です" },
  });
  for (const [query, slug] of [
    ["食品", "health/japanese"],
    ["コント", "health/japanese"],
    ["重金属", "health/chinese"],
    ["중금속".normalize("NFD"), "health/korean"],
    ["안녕", "health/korean"],
    ["ICP検査", "testing/mixed"],
    ["検査", "testing/mixed"],
  ]) {
    assert.equal(searchIndex(documents, query)[0]?.slug, slug, query);
  }
});

test("only public active entries are suggested; current emitter eligibility is preserved", () => {
  const documents = prepareSearchEntries({
    "ingredients/public": { title: "Oil public" },
    "ingredients/hidden": { title: "Oil hidden", noindex: true },
    "ingredients/hidden-string": {
      title: "Oil hidden string",
      noindex: "true",
    },
    "ingredients/retired": { title: "Oil retired", retired: true },
    "ingredients/retired-string": {
      title: "Oil retired string",
      retired: "true",
    },
    "ingredients/empty": { title: " " },
  });
  assert.deepEqual(
    searchIndex(documents, "oil").map((result) => result.slug),
    ["ingredients/public"],
  );
});

test("result descriptions use the summary and remain compact even for legacy indexes", () => {
  const result = searchIndex(entries, "olive oil")[0];
  assert.deepEqual(result, {
    slug: "ingredients/olive-oil",
    title: "Olive Oil",
    category: "Ingredient",
    description: "Evidence on olive oil, processing, and packaging.",
  });
  const documents = prepareSearchEntries({
    "testing/legacy": {
      title: "Legacy",
      content: `A long ${"evidence summary ".repeat(20)}\nHeadings`,
    },
  });
  const description = searchIndex(documents, "legacy")[0].description;
  assert.ok(description.length <= 160);
  assert.ok(description.endsWith("…"));
  assert.ok(!description.includes("Headings"));
});

test("limit is at most eight, ordering is deterministic, and input documents are unchanged", () => {
  const data = Object.fromEntries(
    Array.from({ length: 20 }, (_, index) => [
      `testing/oil-${index}`,
      { title: `Oil ${index}` },
    ]),
  );
  const before = JSON.stringify(data);
  const documents = prepareSearchEntries(data);
  assert.equal(searchIndex(documents, "oil").length, 8);
  assert.equal(searchIndex(documents, "oil", 100).length, 8);
  assert.equal(searchIndex(documents, "oil", 3).length, 3);
  assert.deepEqual(searchIndex(documents, "oil", 0), []);
  assert.deepEqual(
    searchIndex(documents, "oil"),
    searchIndex([...documents].reverse(), "oil"),
  );
  assert.equal(JSON.stringify(data), before);
});
test("completed evidence outranks exact scaffold and structural matches without hiding them", () => {
  const entries = prepareSearchEntries({
    "ingredients/infant-formula": { title: "Infant formula", searchStatus: "developing" },
    "products/infant-formula": { title: "Infant formula", searchStatus: "developing" },
    "ingredients/infant-formula-powder": { title: "Infant formula powder", searchStatus: "structural" },
    "products/infant-formula-powder-non-soy": { title: "Infant formula powder (non-soy)", searchStatus: "standard" },
  })
  const results = searchIndex(entries, "infant formula")
  assert.equal(results[0].slug, "products/infant-formula-powder-non-soy")
  assert.equal(results.length, 4)
})
