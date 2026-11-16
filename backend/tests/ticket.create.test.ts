import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { TestApp } from './testUtils.js';
import { api, createTestApp, validTicket } from './testUtils.js';

/**
 * POST /api/tickets
 *
 * Covers the happy path plus every rule the assessment calls out: title and
 * description non-empty after trimming, priority exactly Low/Medium/High, and
 * status defaulting to Open rather than being client-selectable.
 */
describe('POST /api/tickets', () => {
  let ctx: TestApp;

  beforeEach(() => {
    ctx = createTestApp();
  });
  afterEach(() => {
    ctx.close();
  });

  it('creates a ticket with status Open and camelCase timestamps', async () => {
    const res = await api(ctx.app).post('/api/tickets').send(validTicket);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: expect.any(Number),
      title: validTicket.title,
      description: validTicket.description,
      priority: 'High',
      status: 'Open',
    });
    expect(res.body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(res.body.updatedAt).toBe(res.body.createdAt);
    // snake_case columns must never escape the repository layer.
    expect(res.body).not.toHaveProperty('created_at');
  });

  it('trims surrounding whitespace before storing', async () => {
    const res = await api(ctx.app)
      .post('/api/tickets')
      .send({ ...validTicket, title: '  Spaced  ', description: '  Body  ' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Spaced');
    expect(res.body.description).toBe('Body');
  });

  it('accepts every allowed priority', async () => {
    for (const priority of ['Low', 'Medium', 'High']) {
      const res = await api(ctx.app).post('/api/tickets').send({ ...validTicket, priority });
      expect(res.status).toBe(201);
      expect(res.body.priority).toBe(priority);
    }
  });

  it('rejects an empty or whitespace-only title with a field detail', async () => {
    for (const title of ['', '   ']) {
      const res = await api(ctx.app).post('/api/tickets').send({ ...validTicket, title });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toContainEqual(
        expect.objectContaining({ field: 'title', message: 'Title cannot be empty' }),
      );
    }
  });

  it('rejects an empty or whitespace-only description', async () => {
    for (const description of ['', '   ']) {
      const res = await api(ctx.app).post('/api/tickets').send({ ...validTicket, description });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toContainEqual(expect.objectContaining({ field: 'description' }));
    }
  });

  it('rejects a missing title and a missing priority', async () => {
    const noTitle = await api(ctx.app).post('/api/tickets').send({ ...validTicket, title: undefined });
    expect(noTitle.status).toBe(400);

    const noPriority = await api(ctx.app)
      .post('/api/tickets')
      .send({ title: validTicket.title, description: validTicket.description });
    expect(noPriority.status).toBe(400);
    expect(noPriority.body.error.details).toContainEqual(expect.objectContaining({ field: 'priority' }));
  });

  it('rejects a priority outside the allowed values', async () => {
    for (const priority of ['Urgent', 'high', 'Medium ']) {
      const res = await api(ctx.app).post('/api/tickets').send({ ...validTicket, priority });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects a client-supplied status because status is not client-selectable', async () => {
    const res = await api(ctx.app).post('/api/tickets').send({ ...validTicket, status: 'Resolved' });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toContainEqual(
      expect.objectContaining({ message: 'Unrecognized key: "status"' }),
    );
  });

  it('rejects unknown fields instead of stripping them', async () => {
    const res = await api(ctx.app).post('/api/tickets').send({ ...validTicket, sneaky: true });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toContainEqual(
      expect.objectContaining({ message: 'Unrecognized key: "sneaky"' }),
    );
  });

  it('rejects a non-object JSON body', async () => {
    const res = await api(ctx.app)
      .post('/api/tickets')
      .set('content-type', 'application/json')
      .send('[1,2,3]');
    expect(res.status).toBe(400);
    expect(res.body.error.details).toContainEqual(
      expect.objectContaining({ message: 'Request body must be a JSON object' }),
    );
  });
});
