import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { initializeDatabase } from '../../src/db.js';

beforeAll(async () => {
  initializeDatabase(':memory:');
});

describe('issue creation', () => {
  it('allows an employee to create and view a valid issue', async () => {
    const employeeLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'employee1@company.example', role: 'Employee', password: 'facilityflow-employee' });

    expect(employeeLogin.status).toBe(200);

    const auth = { Authorization: `Bearer ${employeeLogin.body.token}` };
    const res = await request(app)
      .post('/api/issues')
      .set(auth)
      .send({
        description: 'Broken office light',
        category: 'Electrical',
        priority: 'High'
      });

    expect(res.status).toBe(201);
    expect(res.body.issue.category).toBe('Electrical');
    expect(res.body.issue.priority).toBe('High');
    expect(res.body.issue.status).toBe('Open');
    expect(res.body.issue.reporter_id).toBe(employeeLogin.body.user.id);

    const listRes = await request(app)
      .get('/api/issues')
      .set(auth);

    expect(listRes.status).toBe(200);
    expect(listRes.body.issues.length).toBeGreaterThan(0);

    const detailRes = await request(app)
      .get(`/api/issues/${res.body.issue.id}`)
      .set(auth);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.issue.id).toBe(res.body.issue.id);
  });
});
