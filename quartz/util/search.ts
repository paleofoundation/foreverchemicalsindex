/** The public content index owns publication eligibility; search never reads raw sources. */
export interface SearchIndexDocument {
  title: string;
  slug?: string;
  aliases?: string[];
  tags?: string[];
  content?: string;
  description?: string;
  noindex?: boolean | string;
  retired?: boolean | string;
  searchStatus?: "standard" | "developing" | "structural";
}

export interface SearchResult {
  slug: string;
  title: string;
  category: string;
  description: string;
}

export interface PreparedSearchEntry {
  result: SearchResult;
  title: string;
  aliases: string[];
  leaf: string;
  prominent: string;
  content: string;
  priority: number;
  readiness: number;
}

const categories: Record<string, string> = {
  ingredients: "Ingredient",
  products: "Product category",
  metals: "Metal",
  regulations: "Regulation",
  regulators: "Regulator",
  sources: "Source",
  synthesis: "Synthesis",
  microbiome: "Microbiome",
  health: "Health",
  testing: "Testing",
  mitigation: "Mitigation",
  methodology: "Methodology",
};

// Normalize once per document. Unicode letters and numbers remain searchable;
// punctuation becomes a word boundary, so user input never becomes a regexp.
function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .normalize("NFC")
    .toLowerCase()
    // These scripts need no spaces between words. Character boundaries keep
    // a topic searchable inside a sentence and beside Latin abbreviations.
    .replace(
      /([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}])/gu,
      " $1 ",
    )
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function excerpt(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const characters = Array.from(clean);
  if (characters.length <= 160) return clean;
  const shortened = characters.slice(0, 157).join("");
  const boundary = shortened.lastIndexOf(" ");
  return `${boundary > 100 ? shortened.slice(0, boundary) : shortened}…`;
}

/** Prepare once after fetching static/contentIndex.json; reuse for every keystroke. */
export function prepareSearchEntries(
  data: Record<string, SearchIndexDocument>,
): PreparedSearchEntry[] {
  const entries: PreparedSearchEntry[] = [];
  for (const [slug, document] of Object.entries(data)) {
    // Defensive checks also make an older/full index safe to consume. Do not
    // invent additional evidence-tier rules here: the emitter owns that policy.
    if (
      document.noindex === true ||
      document.noindex === "true" ||
      document.retired === true ||
      document.retired === "true"
    ) {
      continue;
    }
    const title = document.title?.trim();
    if (!title) continue;
    const family = slug.split("/")[0];
    const normalizedTitle = normalize(title);
    const aliases = (document.aliases ?? []).map(normalize).filter(Boolean);
    const tags = (document.tags ?? []).map(normalize).join(" ");
    const path = normalize(slug);
    const content = document.content ?? "";
    const description = document.description?.trim() || content.split("\n")[0];
    entries.push({
      result: {
        slug,
        title,
        category: categories[family] ?? "Index page",
        description: excerpt(description),
      },
      title: normalizedTitle,
      aliases,
      leaf: normalize(slug.split("/").at(-1) ?? ""),
      prominent: ` ${[normalizedTitle, ...aliases, path, tags].join(" ")} `,
      content: ` ${normalize(`${document.description ?? ""} ${content}`)} `,
      readiness: document.searchStatus === "structural" ? 0.35 : document.searchStatus === "developing" ? 0.45 : 1,
      // Prefer the compiled topic page over an equally matching primary paper.
      // This is a tie-breaker within each relevance tier, never an exclusion.
      priority:
        family === "ingredients" || family === "metals"
          ? 25
          : family === "sources"
            ? 0
            : 20,
    });
  }
  return entries;
}

function allTerms(field: string, terms: string[]): boolean {
  return terms.every((term, index) =>
    field.includes(` ${term}${index === terms.length - 1 ? "" : " "}`),
  );
}

function fieldScore(
  field: string,
  query: string,
  terms: string[],
  exact: number,
  prefix: number,
  phrase: number,
  tokens: number,
): number {
  if (field === query) return exact;
  if (field.startsWith(query)) return prefix;
  if (field.includes(` ${query}`)) return phrase;
  return allTerms(` ${field} `, terms) ? tokens : 0;
}

/** Title/alias autocomplete first, then tags and the emitted page-text digest. */
export function searchIndex(
  entries: readonly PreparedSearchEntry[],
  input: string,
  limit = 8,
): SearchResult[] {
  const query = normalize(input);
  if (!query || limit <= 0) return [];
  const terms = query.split(" ");
  const matches: { entry: PreparedSearchEntry; score: number }[] = [];

  for (const entry of entries) {
    let score = fieldScore(entry.title, query, terms, 1000, 800, 650, 500);
    for (const alias of entry.aliases) {
      score = Math.max(
        score,
        fieldScore(alias, query, terms, 900, 740, 620, 450),
      );
    }
    score = Math.max(
      score,
      fieldScore(entry.leaf, query, terms, 850, 700, 600, 430),
    );
    if (score === 0 && allTerms(entry.prominent, terms)) score = 380;
    if (score === 0 && allTerms(entry.content, terms)) {
      score = entry.content.includes(` ${query}`) ? 130 : 100;
    }
    if (score === 0) continue;
    // Keep short topic names ahead of verbose source titles on partial typing.
    const verbosity = Math.min(
      15,
      Math.max(0, entry.title.split(" ").length - 3),
    );
    matches.push({ entry, score: score * entry.readiness + entry.priority - verbosity });
  }

  return matches
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.entry.title.localeCompare(b.entry.title) ||
        a.entry.result.slug.localeCompare(b.entry.result.slug),
    )
    .slice(0, Math.min(8, Math.floor(limit)))
    .map(({ entry }) => entry.result);
}
