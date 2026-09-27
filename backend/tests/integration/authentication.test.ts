import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { initializeDatabase } from '../../src/db.js';

beforeAll(async () => {
  await initializeDatabase(':memory:');
});

describe('demo authentication', () => {
  it('authenticates a pre-provisioned employee and uses its identity for reports', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'employee1@company.example', role: 'Employee', password: 'facilityflow-employee' });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe('Employee');
    expect(login.body.user.name).toBe('Chandupriya');
    expect(login.body.user.email).toBeUndefined();
    expect(login.body.user.password).toBeUndefined();

    const created = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ reporterId: 40, description: 'Authenticated identity check', category: 'General Facilities', priority: 'Low' });
    expect(created.status).toBe(201);
    expect(created.body.issue.reporter_id).toBe(login.body.user.id);
    expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`)).body.user.role).toBe('Employee');
  });

  it('authenticates a provisioned administrator with the administrator credential', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'admin1@facilityflow.demo', role: 'Facility Administrator', password: 'facilityflow-admin' });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe('Facility Administrator');
    expect(login.body.user.password).toBeUndefined();
    expect((await request(app).get('/api/users').set('Authorization', `Bearer ${login.body.token}`)).status).toBe(200);
  });

  it('rejects invalid credentials and mismatched role selection', async () => {
    const invalid = await request(app).post('/api/auth/login').send({ email: 'employee1@company.example', role: 'Employee', password: 'wrong-password' });
    expect(invalid.status).toBe(401);

    const employeeAsAdmin = await request(app).post('/api/auth/login').send({ email: 'employee1@company.example', role: 'Facility Administrator', password: 'facilityflow-employee' });
    expect(employeeAsAdmin.status).toBe(403);

    const adminAsEmployee = await request(app).post('/api/auth/login').send({ email: 'admin1@facilityflow.demo', role: 'Employee', password: 'facilityflow-admin' });
    expect(adminAsEmployee.status).toBe(403);
  });

  it('rejects email login without an explicit role selection', async () => {
    const response = await request(app).post('/api/auth/login').send({ email: 'employee1@company.example', password: 'facilityflow-employee' });
    expect(response.status).toBe(401);
  });
});
