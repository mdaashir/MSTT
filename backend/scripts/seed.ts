/**
 * Optional seed script.
 *
 * Inserts a handful of realistic tickets so the UI is not empty on first run.
 * Run it with `npm run seed` from the backend package. Safe to run twice: it
 * skips entirely if any ticket already exists, so it can never duplicate rows.
 */

import { config } from '../src/config.js';
import { createDatabase } from '../src/db/index.js';
import { createTicketRepository } from '../src/tickets/ticket.repository.js';

const db = createDatabase(config.databasePath);

const existing = db.prepare('SELECT COUNT(*) AS count FROM tickets').get() as { count: number };
if (existing.count > 0) {
  console.log(`[seed] ${existing.count} ticket(s) already present, nothing to do`);
  db.close();
  process.exit(0);
}

const repository = createTicketRepository(db);

const samples = [
  {
    title: 'Printer jam on floor 3',
    description: 'The shared printer keeps jamming on duplex jobs. Paper tray may need clearing.',
    priority: 'High' as const,
  },
  {
    title: 'VPN drops every 10 minutes',
    description: 'Remote access disconnects repeatedly. Happens on both home and office networks.',
    priority: 'Medium' as const,
  },
  {
    title: 'Reception scanner outputs blank pages',
    description: 'Scanner at the front desk produces empty pages for any document.',
    priority: 'Low' as const,
  },
  {
    title: 'Laptop fan runs loud when docked',
    description: 'Fan spins up as soon as the second monitor is connected. Not hot to the touch.',
    priority: 'Medium' as const,
  },
  {
    title: 'Meetroom projector shows no signal',
    description: 'HDMI input on the meeting room projector reports no signal from any laptop.',
    priority: 'High' as const,
  },
];

for (const sample of samples) {
  const ticket = repository.create(sample);
  console.log(`[seed] created #${ticket.id} ${ticket.title}`);
}

console.log(`[seed] done, ${samples.length} tickets created in ${config.databasePath}`);
db.close();
