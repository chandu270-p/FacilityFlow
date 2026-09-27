import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { initializeDatabase } from '../../src/db.js';

let issueId: number;

beforeAll(async () => {
  await initializeDatabase(':memory:');
  const created = await request(app).post('/api/issues').set('x-user-role', 'Employee').send({ reporterId: 1, description: 'Restricted field test', category: 'Electrical', priority: 'Medium' });
  issueId = created.body.issue.id;
});

describe('employee restricted mutations', () => {
  it.each([
    ['category', { category: 'HVAC' }],
    ['priority', { priority: 'Critical' }],
    ['assignee', { assignee_id: 41 }],
    ['status', { status: 'In Progress' }],
    ['resolution notes', { resolution_notes: 'Not allowed' }],
    ['resolved timestamp', { resolved_at: '2026-01-01T00:00:00.000Z' }],
    ['closed timestamp', { closed_at: '2026-01-01T00:00:00.000Z' }]
  ])('rejects %s without changing the issue', async (_field, patch) => {
    const before = await request(app).get(`/api/issues/${issueId}`).set('x-user-role', 'Employee');
    const response = await request(app).patch(`/api/issues/${issueId}`).set('x-user-role', 'Employee').send(patch);
    const after = await request(app).get(`/api/issues/${issueId}`).set('x-user-role', 'Employee');
    expect(response.status).toBe(403);
    expect(after.body.issue).toEqual(before.body.issue);
  });
});
