/** Shared inline search shell; TopNav owns the global search script and styles. */
export function SearchField({
  placeholder = "Search the index",
  shortcut = false,
}: {
  placeholder?: string
  shortcut?: boolean
}) {
  return (
    <>
      <form
        class="hmi-search-form"
        role="search"
        aria-label={shortcut ? "Site navigation search" : "Site search"}
      >
        <span class="hmi-search-icon" aria-hidden="true">
          ⌕
        </span>
        <input
          class="search-bar"
          type="search"
          name="q"
          autocomplete="off"
          placeholder={placeholder}
          aria-label={placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded="false"
        />
        {shortcut && (
          <span class="hmi-topnav-kbd" aria-hidden="true">
            /
          </span>
        )}
        <button class="hmi-search-submit" type="submit" aria-label="Search the index">
          Search
        </button>
      </form>
      <div class="hmi-search-dropdown" hidden>
        <div class="hmi-search-results" role="listbox" aria-label="Suggested pages"></div>
        <p class="hmi-search-status" role="status" aria-live="polite"></p>
      </div>
    </>
  )
}
