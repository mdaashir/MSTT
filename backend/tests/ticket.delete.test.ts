import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { TestApp } from './testUtils.js';
import { api, createTestApp, seedTickets } from './testUtils.js';

/**
 * DELETE /api/tickets/:id
 *
 * Hard delete: the row is gone, the list reflects it, and a second delete is a
 * 404 rather than a silent success.
 */
describe('DELETE /api/tickets/:id', () => {
  let ctx: TestApp;

  beforeEach(() => {
    ctx = createTestApp();
    seedTickets(ctx.db, [
      { title: 'Old keyboard', description: 'd', priority: 'Low', status: 'Open', createdAt: '2024-04-01T00:00:00.000Z' },
      { title: 'Old mouse', description: 'd', priority: 'Low', status: 'Open', createdAt: '2024-04-02T00:00:00.000Z' },
    ]);
  });
  afterEach(() => {
    ctx.close();
  });

  it('deletes a ticket and returns 204 with no body', async () => {
    const res = await api(ctx.app).delete('/api/tickets/1');
    expect(res.status).toBe(204);
    expect(res.text).toBe('');

    const list = await api(ctx.app).get('/api/tickets');
    expect(list.body.map((ticket: { title: string }) => ticket.title)).toEqual(['Old mouse']);
  });

  it('returns 404 when the ticket is already gone', async () => {
    await api(ctx.app).delete('/api/tickets/1');
    const res = await api(ctx.app).delete('/api/tickets/1');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('rejects an invalid id before touching the database', async () => {
    const res = await api(ctx.app).delete('/api/tickets/abc');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
