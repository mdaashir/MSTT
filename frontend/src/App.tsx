import { useState } from 'react';
import type { SortOrder } from './types.js';
import type { StatusFilter } from './components/FilterBar.js';
import { TicketList } from './components/TicketList.js';
import { TicketForm } from './components/TicketForm.js';

/**
 * Application shell.
 *
 * Filter, sort and selection live here rather than inside a child so they survive
 * navigating between views. `refreshToken` is the one lever the create and update
 * flows pull to make the list re-read from the server.
 */
export function App() {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortOrder>('newest');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

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
            <TicketList
              status={status}
              sort={sort}
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
              <section className="panel">
                <h2>Details</h2>
                <p className="muted">Ticket #{selectedId} selected.</p>
              </section>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
