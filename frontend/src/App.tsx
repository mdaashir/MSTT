import { useState } from 'react';
import type { SortOrder } from './types.js';
import type { StatusFilter } from './components/FilterBar.js';
import { TicketList } from './components/TicketList.js';

/**
 * Application shell.
 *
 * Filter and sort live here rather than inside the list so they survive
 * navigating into a ticket and back. Later steps add the create form and the
 * details view beside the list.
 */
export function App() {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortOrder>('newest');
  const [selectedId, setSelectedId] = useState<number | null>(null);

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
            <TicketList
              status={status}
              sort={sort}
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
