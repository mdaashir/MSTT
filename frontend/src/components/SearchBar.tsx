/**
 * Search box.
 *
 * Controlled by the shell so the value survives navigation, but the shell only
 * puts the debounced value into the API query. This component does not know
 * about HTTP at all.
 */
export function SearchBar({
  value,
  onChange,
  placeholder = 'Search by title…',
}: {
  value: string;
  onChange(next: string): void;
  placeholder?: string;
}) {
  return (
    <div className="search-bar">
      <label className="field-label" htmlFor="ticket-search">
        Search
      </label>
      <div className="search-input-wrap">
        <input
          id="ticket-search"
          type="search"
          value={value}
          placeholder={placeholder}
          maxLength={200}
          onChange={(event) => onChange(event.target.value)}
        />
        {value ? (
          <button type="button" className="search-clear" onClick={() => onChange('')}>
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
