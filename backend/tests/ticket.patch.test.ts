import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { TestApp } from './testUtils.js';
import { api, createTestApp, seedTickets } from './testUtils.js';

/**
 * PATCH /api/tickets/:id
 *
 * The important property is partiality: updating the status must not disturb the
 * title, description or priority, and updated_at must always advance.
 */
describe('PATCH /api/tickets/:id', () => {
  let ctx: TestApp;

  beforeEach(() => {
    ctx = createTestApp();
    seedTickets(ctx.db, [
      {
        title: 'Badge reader',
        description: 'Reader at door B rejects valid badges.',
        priority: 'Low',
        status: 'Open',
        createdAt: '2024-03-01T00:00:00.000Z',
      },
    ]);
  });
  afterEach(() => {
    ctx.close();
  });

  it('updates only the status and leaves everything else intact', async () => {
    const res = await api(ctx.app).patch('/api/tickets/1').send({ status: 'In Progress' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: 1,
      title: 'Badge reader',
      description: 'Reader at door B rejects valid badges.',
      priority: 'Low',
      status: 'In Progress',
      createdAt: '2024-03-01T00:00:00.000Z',
    });
    expect(res.body.updatedAt).not.toBe('2024-03-01T00:00:00.000Z');
  });

  it('updates several provided fields at once', async () => {
    const res = await api(ctx.app)
      .patch('/api/tickets/1')
      .send({ status: 'Resolved', priority: 'High' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Resolved');
    expect(res.body.priority).toBe('High');
  });

  it('accepts every allowed status', async () => {
    for (const status of ['Open', 'In Progress', 'Resolved']) {
      const res = await api(ctx.app).patch('/api/tickets/1').send({ status });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(status);
    }
  });

  it('rejects an empty body because it would change nothing', async () => {
    const res = await api(ctx.app).patch('/api/tickets/1').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.details).toContainEqual(
      expect.objectContaining({ message: 'Provide at least one field to update' }),
    );
  });

  it('rejects an invalid status, priority and blank title', async () => {
    const bad = [{ status: 'Done' }, { priority: 'Urgent' }, { title: '   ' }];
    for (const body of bad) {
      const res = await api(ctx.app).patch('/api/tickets/1').send(body);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects unknown fields', async () => {
    const res = await api(ctx.app).patch('/api/tickets/1').send({ status: 'Open', nope: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toContainEqual(
      expect.objectContaining({ message: 'Unrecognized key: "nope"' }),
    );
  });

  it('returns 404 for an unknown id', async () => {
    const res = await api(ctx.app).patch('/api/tickets/999').send({ status: 'Open' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
