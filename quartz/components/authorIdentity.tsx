import { FullSlug, SimpleSlug, resolveRelative } from "../util/path";

export const KAREN = {
  name: "Karen Pendergrass",
  slug: "authors/karen-pendergrass" as SimpleSlug,
  orcid: "0000-0002-2348-7259",
  portrait: "/static/authors/karen-pendergrass-hmi-pink.webp",
  summary:
    "Standards architect and microbiome researcher connecting contaminant evidence, food exposure, and microbial metallomics.",
  affiliations: [
    {
      name: "Institute of Contaminant Standards",
      url: "https://contaminantstandards.com/",
    },
    { name: "Paleo Foundation", url: "https://paleofoundation.com/" },
    { name: "Microbiome Medicine", url: "https://microbiomemedicine.com/" },
    { name: "WikiBiome", url: "https://www.wikibiome.com/" },
  ],
};

export const OrcidIdIcon = () => (
  <svg
    class="orcid-id-icon"
    viewBox="0 0 256 256"
    width="16"
    height="16"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="128" cy="128" r="128" fill="#A6CE39" />
    <path
      fill="#fff"
      d="M86.3 186.2H70.9V79.1h15.4v107.1zm22.6-107.1h41.6c39.6 0 57 28.3 57 53.6 0 27.5-21.5 53.6-56.8 53.6h-41.8V79.1zm15.4 93.3h24.5c34.9 0 42.9-26.5 42.9-39.7 0-21.5-13.7-39.7-43.7-39.7h-23.7v79.4z"
    />
    <circle cx="78.6" cy="56.8" r="10.1" fill="#fff" />
  </svg>
);

export function AuthorPortrait({ slug }: { slug: FullSlug }) {
  const href = resolveRelative(slug, KAREN.slug);
  return (
    <div class="author-hover" data-author-card>
      <a
        class="hero-author-portrait"
        href={href}
        aria-label="About Karen Pendergrass"
        aria-describedby="author-card-summary"
      >
        <img src={KAREN.portrait} alt={KAREN.name} width="72" height="72" />
      </a>
      <section class="author-card" aria-label="About the author">
        <div class="author-card-heading">
          <img
            src={KAREN.portrait}
            alt=""
            width="56"
            height="56"
            loading="lazy"
          />
          <div>
            <span class="author-card-eyebrow">About the author</span>
            <a href={href}>{KAREN.name}</a>
          </div>
        </div>
        <p id="author-card-summary">{KAREN.summary}</p>
        <p class="author-card-affiliations">
          {KAREN.affiliations.map((a) => a.name).join(" · ")}
        </p>
        <a
          class="author-card-orcid"
          href={`https://orcid.org/${KAREN.orcid}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <OrcidIdIcon /> {KAREN.orcid}
        </a>
        <a class="author-card-bio" href={href}>
          View biography &amp; public works <span aria-hidden="true">→</span>
        </a>
      </section>
    </div>
  );
}

export function AuthorProfileHero({ slug }: { slug: FullSlug }) {
  return (
    <div class="hero-band hero-band--author">
      <div class="hero-grid">
        <div class="hero-subject author-profile-portrait">
          <img src={KAREN.portrait} alt={KAREN.name} width="236" height="236" />
          <span class="author-profile-caption">
            Researcher &amp; standards architect
          </span>
        </div>
        <div class="hero-main">
          <nav class="hero-crumb" aria-label="Breadcrumb">
            <a href={resolveRelative(slug, "index" as SimpleSlug)}>Index</a>
            <span aria-hidden="true">/</span>
            <a href={resolveRelative(slug, "about" as SimpleSlug)}>About</a>
            <span aria-hidden="true">/</span>
            <span class="cur">Author profile</span>
          </nav>
          <h1 class="hero-title">{KAREN.name}</h1>
          <a
            class="author-profile-orcid"
            href={`https://orcid.org/${KAREN.orcid}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <OrcidIdIcon /> ORCID {KAREN.orcid}
          </a>
          <p class="hero-dek">
            {KAREN.summary} Architect of the Forever Chemicals Index evidence system.
          </p>
          <div class="hero-meta">
            <div class="hero-acts">
              <a class="hero-act" href="#public-works">
                Public works
              </a>
              <a class="hero-act" href="#work-history">
                Work history
              </a>
              <a
                class="hero-act"
                href={`https://www.wikibiome.com/researchers/${KAREN.orcid}`}
              >
                WikiBiome profile ↗
              </a>
            </div>
          </div>
        </div>
        <aside
          class="hero-sidebar author-affiliations"
          aria-label="Affiliations"
        >
          <h2>Affiliations</h2>
          {KAREN.affiliations.map((a) => (
            <a
              key={a.name}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {a.name}
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </aside>
      </div>
    </div>
  );
}
