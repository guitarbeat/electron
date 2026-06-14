const fs = require('fs');

const path = 'src/components/movies/MoviesTopControls.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add MagicToggle import
content = content.replace(
  "import Button from '@/ui/Button';",
  "import Button from '@/ui/Button';\nimport { MagicToggle } from '@/ui/MagicToggle';"
);

// Replace the filter chips with MagicToggle
const search = `                    {(
                      [
                        { value: 'all', label: 'All' },
                        { value: 'movie', label: 'Movies' },
                        { value: 'series', label: 'TV Series' },
                      ] as const
                    ).map(({ value, label }) => {
                      const count =
                        value === 'all'
                          ? autocompleteResults.length
                          : autocompleteResults.filter((r) => r.type === value).length;
                      const isDisabled = count === 0 && value !== 'all';
                      return (
                        <button
                          key={value}
                          type="button"
                          className={\`watchlist-top-controls__autocomplete-filter-chip\${
                            autocompleteTypeFilter === value ? ' is-active' : ''
                          }\${count === 0 ? ' is-empty' : ''}\`}
                          disabled={isDisabled}
                          onPointerDown={(e) => {
                            e.preventDefault(); // prevents input blur on all pointer types
                            if (!isDisabled) setAutocompleteTypeFilter(value);
                          }}
                        >
                          {label}
                          <span className="watchlist-top-controls__autocomplete-filter-count">{count}</span>
                        </button>
                      );
                    })}
`;

const replace = `                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                      <MagicToggle
                        ariaLabel="Filter by type"
                        value={autocompleteTypeFilter}
                        onChange={(val: 'all' | 'movie' | 'series') => setAutocompleteTypeFilter(val)}
                        options={[
                          {
                            value: 'all',
                            label: 'All',
                            count: autocompleteResults.length
                          },
                          {
                            value: 'movie',
                            label: 'Movies',
                            count: autocompleteResults.filter(r => r.type === 'movie').length,
                            disabled: autocompleteResults.filter(r => r.type === 'movie').length === 0
                          },
                          {
                            value: 'series',
                            label: 'TV Series',
                            count: autocompleteResults.filter(r => r.type === 'series').length,
                            disabled: autocompleteResults.filter(r => r.type === 'series').length === 0
                          }
                        ]}
                      />
                    </div>
`;

content = content.replace(search, replace);
fs.writeFileSync(path, content);
