import { useState } from 'react';
import type { SortOrder } from './types.js';
import type { StatusFilter } from './components/FilterBar.js';
import { TicketList } from './components/TicketList.js';
import { TicketForm } from './components/TicketForm.js';
import { TicketDetails } from './components/TicketDetails.js';
import { SearchBar } from './components/SearchBar.js';
import { useDebouncedValue } from './hooks/useDebouncedValue.js';

/**
 * Application shell.
 *
 * Filter, sort, search and selection live here rather than inside a child so they
 * survive navigating between views. `refreshToken` is the one lever the create,
 * update and delete flows pull to make the list re-read from the server.
 */
export function App() {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortOrder>('newest');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  // Keystrokes update the input instantly, but only the settled value reaches
  // the API query, so typing does not fire a request per character.
  const debouncedSearch = useDebouncedValue(search);

  const refreshList = () => setRefreshToken((token) => token + 1);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Mini Support Ticket Tracker</h1>
        <p className="app-subtitle">
          Create tickets, track their status, and filter the list by state.
        </p>
      </header>

      <main className="app-main">
        <div className="layout">
          <div className="layout-column">
            <TicketForm
              onCreated={(ticket) => {
                // Show the new ticket straight away: jump back to the first page
                // of a filter that can actually contain it.
                setStatus('all');
                setSort('newest');
                setSelectedId(ticket.id);
                refreshList();
              }}
            />
            <SearchBar value={search} onChange={setSearch} />
            <TicketList
              status={status}
              sort={sort}
              search={debouncedSearch}
              refreshToken={refreshToken}
              onStatusChange={setStatus}
              onSortChange={setSort}
              onSelect={setSelectedId}
            />
          </div>
          <aside className="layout-column layout-sidebar">
            {selectedId === null ? (
              <section className="panel">
                <h2>Details</h2>
                <p className="muted">Select a ticket to see its full description.</p>
              </section>
            ) : (
              <TicketDetails
                id={selectedId}
                onUpdated={() => {
                  // A status change affects the list too: it may move into or out
                  // of the active filter, so re-read from the server.
                  refreshList();
                }}
                onDeleted={() => {
                  // The ticket is gone: drop the selection, then resync the list.
                  setSelectedId(null);
                  refreshList();
                }}
              />
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
