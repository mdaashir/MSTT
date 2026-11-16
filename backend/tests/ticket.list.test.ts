import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { TestApp } from './testUtils.js';
import { api, createTestApp, seedTickets } from './testUtils.js';

/**
 * GET /api/tickets
 *
 * The list endpoint carries the most behaviour, so it gets the most coverage:
 * default ordering, status filter, title search, both sorts, pagination windows,
 * composition of filters, and rejection of out-of-range params.
 */
describe('GET /api/tickets', () => {
  let ctx: TestApp;

  const seed = () =>
    seedTickets(ctx.db, [
      { title: 'Printer jam', description: 'd', priority: 'High', status: 'Open', createdAt: '2024-01-01T00:00:00.000Z' },
      { title: 'VPN drops', description: 'd', priority: 'Medium', status: 'In Progress', createdAt: '2024-01-02T00:00:00.000Z' },
      { title: 'Printer toner', description: 'd', priority: 'Low', status: 'Resolved', createdAt: '2024-01-03T00:00:00.000Z' },
      { title: 'Laptop slow', description: 'd', priority: 'High', status: 'Open', createdAt: '2024-01-04T00:00:00.000Z' },
    ]);

  beforeEach(() => {
    ctx = createTestApp();
    seed();
  });
  afterEach(() => {
    ctx.close();
  });

  const titles = (body: { title: string }[]) => body.map((ticket) => ticket.title);

  it('lists tickets newest first by default', async () => {
    const res = await api(ctx.app).get('/api/tickets');
    expect(res.status).toBe(200);
    expect(titles(res.body)).toEqual(['Laptop slow', 'Printer toner', 'VPN drops', 'Printer jam']);
  });

  it('sorts oldest first when asked', async () => {
    const res = await api(ctx.app).get('/api/tickets?sort=oldest');
    expect(titles(res.body)).toEqual(['Printer jam', 'VPN drops', 'Printer toner', 'Laptop slow']);
  });

  it('filters by status', async () => {
    const open = await api(ctx.app).get('/api/tickets?status=Open');
    expect(titles(open.body)).toEqual(['Laptop slow', 'Printer jam']);

    const resolved = await api(ctx.app).get('/api/tickets?status=Resolved');
    expect(titles(resolved.body)).toEqual(['Printer toner']);

    const inProgress = await api(ctx.app).get('/api/tickets?status=In%20Progress');
    expect(titles(inProgress.body)).toEqual(['VPN drops']);
  });

  it('searches titles case-insensitively', async () => {
    for (const q of ['printer', 'PRINTER', 'PrInTeR']) {
      const res = await api(ctx.app).get(`/api/tickets?q=${encodeURIComponent(q)}`);
      expect(titles(res.body)).toEqual(['Printer toner', 'Printer jam']);
    }
  });

  it('composes the status filter with the title search', async () => {
    const res = await api(ctx.app).get('/api/tickets?status=Open&q=printer');
    expect(titles(res.body)).toEqual(['Printer jam']);
  });

  it('pages with non-overlapping limit and offset windows', async () => {
    const page1 = await api(ctx.app).get('/api/tickets?limit=2&offset=0');
    const page2 = await api(ctx.app).get('/api/tickets?limit=2&offset=2');

    expect(titles(page1.body)).toEqual(['Laptop slow', 'Printer toner']);
    expect(titles(page2.body)).toEqual(['VPN drops', 'Printer jam']);
    expect(new Set([...titles(page1.body), ...titles(page2.body)]).size).toBe(4);
  });

  it('returns an empty array past the end instead of an error', async () => {
    const res = await api(ctx.app).get('/api/tickets?limit=2&offset=99');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('applies the filter before pagination', async () => {
    const res = await api(ctx.app).get('/api/tickets?status=Open&limit=1&offset=1');
    expect(titles(res.body)).toEqual(['Printer jam']);
  });

  it('rejects out-of-range and non-numeric pagination values', async () => {
    for (const query of ['limit=0', 'limit=101', 'limit=abc', 'offset=-1', 'offset=1.5']) {
      const res = await api(ctx.app).get(`/api/tickets?${query}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects an unknown status and sort value', async () => {
    for (const query of ['status=Nope', 'sort=sideways']) {
      const res = await api(ctx.app).get(`/api/tickets?${query}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('returns an empty array when nothing matches', async () => {
    const res = await api(ctx.app).get('/api/tickets?q=nothing-matches-this');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
