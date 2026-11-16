import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { TestApp } from './testUtils.js';
import { api, createTestApp, seedTickets } from './testUtils.js';

/**
 * GET /api/tickets/:id
 *
 * Found, not found, and the id validation rules that guard the SQL call.
 */
describe('GET /api/tickets/:id', () => {
  let ctx: TestApp;

  beforeEach(() => {
    ctx = createTestApp();
    seedTickets(ctx.db, [
      {
        title: 'Monitor flicker',
        description: 'Flickers on the left half of the screen.',
        priority: 'Medium',
        status: 'Open',
        createdAt: '2024-02-01T00:00:00.000Z',
      },
    ]);
  });
  afterEach(() => {
    ctx.close();
  });

  it('returns the ticket with its full description', async () => {
    const res = await api(ctx.app).get('/api/tickets/1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: 1,
      title: 'Monitor flicker',
      description: 'Flickers on the left half of the screen.',
      priority: 'Medium',
      status: 'Open',
      createdAt: '2024-02-01T00:00:00.000Z',
      updatedAt: '2024-02-01T00:00:00.000Z',
    });
  });

  it('returns 404 with the shared error shape for an unknown id', async () => {
    const res = await api(ctx.app).get('/api/tickets/999');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Ticket 999 not found' },
    });
  });

  it('rejects ids that are not positive integers', async () => {
    for (const id of ['0', '-1', 'abc', '1.5']) {
      const res = await api(ctx.app).get(`/api/tickets/${id}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
  });
});
