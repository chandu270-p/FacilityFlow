import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { initializeDatabase } from '../../src/db.js';
import { assertSeedData } from '../../src/seed/validation.js';

beforeAll(async () => {
  await initializeDatabase(':memory:');
});

describe('FacilityFlow demo flow', () => {
  it('supports employee reporting and administrator resolution', async () => {
    expect(assertSeedData().valid).toBe(true);
    const employeeLogin = await request(app).post('/api/auth/login').send({ email: 'employee1@company.example', role: 'Employee', password: 'facilityflow-employee' });
    const employeeAuth = { Authorization: `Bearer ${employeeLogin.body.token}` };
    const created = await request(app).post('/api/issues').set(employeeAuth).send({ description: 'Demo flow light outage', category: 'Electrical', priority: 'High' });
    expect(created.status).toBe(201);
    expect((await request(app).get('/api/issues').set(employeeAuth)).status).toBe(200);

    const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admin1@facilityflow.demo', role: 'Facility Administrator', password: 'facilityflow-admin' });
    const adminAuth = { Authorization: `Bearer ${adminLogin.body.token}` };
    const id = created.body.issue.id;
    expect((await request(app).patch(`/api/issues/${id}`).set(adminAuth).send({ status: 'In Progress' })).status).toBe(200);
    expect((await request(app).patch(`/api/issues/${id}`).set(adminAuth).send({ status: 'Resolved', resolution_notes: 'Demo repair complete' })).status).toBe(200);
    const closed = await request(app).patch(`/api/issues/${id}`).set(adminAuth).send({ status: 'Closed', resolution_notes: 'Demo closure verified' });
    expect(closed.status).toBe(200);
  });
});
