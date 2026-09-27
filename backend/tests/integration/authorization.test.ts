import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { initializeDatabase } from '../../src/db.js';

beforeAll(async () => {
  initializeDatabase(':memory:');
});

describe('authorization', () => {
  it('rejects employee mutation attempts with 403', async () => {
    const createRes = await request(app)
      .post('/api/issues')
      .send({ reporterId: 1, description: 'Leak in rest room', category: 'Plumbing', priority: 'Medium' })
      .set('x-user-role', 'Employee');

    const issueId = createRes.body.issue.id;
    const res = await request(app)
      .patch(`/api/issues/${issueId}`)
      .send({ priority: 'Critical' })
      .set('x-user-role', 'Employee');

    expect(res.status).toBe(403);
  });
});
