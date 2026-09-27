import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { initializeDatabase } from '../../src/db.js';

let issueId: number;
let adminAuth: { Authorization: string };
let employeeAuth: { Authorization: string };

beforeAll(async () => {
  await initializeDatabase(':memory:');

  const employeeLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'employee1@company.example', role: 'Employee', password: 'facilityflow-employee' });
  employeeAuth = { Authorization: `Bearer ${employeeLogin.body.token}` };

  const createResponse = await request(app)
    .post('/api/issues')
    .set(employeeAuth)
    .send({ description: 'Lifecycle acceptance issue', category: 'Electrical', priority: 'High' });
  issueId = createResponse.body.issue.id;

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin1@facilityflow.demo', role: 'Facility Administrator', password: 'facilityflow-admin' });
  adminAuth = { Authorization: `Bearer ${adminLogin.body.token}` };
});

describe('administrator lifecycle', () => {
  async function createIssue(description: string) {
    const response = await request(app)
      .post('/api/issues')
      .set(employeeAuth)
      .send({ description, category: 'Electrical', priority: 'Medium' });
    expect(response.status).toBe(201);
    return response.body.issue.id as number;
  }

  it('updates operational fields and progresses through the valid lifecycle', async () => {
    const admins = await request(app).get('/api/users').set(adminAuth);
    const administrator = admins.body.users.find((user: { role: string }) => user.role === 'Facility Administrator');

    const categorized = await request(app)
      .patch(`/api/issues/${issueId}`)
      .set(adminAuth)
      .send({ category: 'HVAC', priority: 'Critical', assignee_id: administrator.id });
    expect(categorized.status).toBe(200);
    expect(categorized.body.issue.assignee_id).toBe(administrator.id);

    expect((await request(app).patch(`/api/issues/${issueId}`).set(adminAuth).send({ status: 'In Progress' })).status).toBe(200);
    expect((await request(app).patch(`/api/issues/${issueId}`).set(adminAuth).send({ status: 'Resolved' })).status).toBe(400);
    expect((await request(app).patch(`/api/issues/${issueId}`).set(adminAuth).send({ status: 'Resolved', resolution_notes: 'Repair completed' })).status).toBe(200);
    expect((await request(app).patch(`/api/issues/${issueId}`).set(adminAuth).send({ status: 'Closed', resolution_notes: 'Closure verified' })).status).toBe(200);
  });

  it('rejects invalid transitions and employee assignees', async () => {
    const invalidIssue = await request(app)
      .post('/api/issues')
      .set({ Authorization: `Bearer ${(await request(app).post('/api/auth/login').send({ email: 'employee2@company.example', role: 'Employee', password: 'facilityflow-employee' })).body.token}` })
      .send({ description: 'Invalid transition issue', category: 'Plumbing', priority: 'Medium' });

    const invalidTransition = await request(app)
      .patch(`/api/issues/${invalidIssue.body.issue.id}`)
      .set(adminAuth)
      .send({ status: 'Closed', resolution_notes: 'This should fail before resolution' });
    expect(invalidTransition.status).toBe(400);

    const employeeAssignee = await request(app)
      .patch(`/api/issues/${invalidIssue.body.issue.id}`)
      .set(adminAuth)
      .send({ assignee_id: 1 });
    expect(employeeAssignee.status).toBe(400);
  });

  it('accepts unchanged statuses while validating actual lifecycle changes', async () => {
    const openIssueId = await createIssue('Open status unchanged');
    const openAgain = await request(app)
      .patch(`/api/issues/${openIssueId}`)
      .set(adminAuth)
      .send({ status: 'Open' });
    expect(openAgain.status).toBe(200);

    const inProgressIssueId = await createIssue('In progress status unchanged');
    expect((await request(app).patch(`/api/issues/${inProgressIssueId}`).set(adminAuth).send({ status: 'In Progress' })).status).toBe(200);
    const inProgressWithCategory = await request(app)
      .patch(`/api/issues/${inProgressIssueId}`)
      .set(adminAuth)
      .send({ status: 'In Progress', category: 'HVAC' });
    expect(inProgressWithCategory.status).toBe(200);
    expect(inProgressWithCategory.body.issue.category).toBe('HVAC');

    const resolvedIssueId = await createIssue('Resolved status unchanged');
    expect((await request(app).patch(`/api/issues/${resolvedIssueId}`).set(adminAuth).send({ status: 'In Progress' })).status).toBe(200);
    expect((await request(app).patch(`/api/issues/${resolvedIssueId}`).set(adminAuth).send({ status: 'Resolved', resolution_notes: 'Repair completed' })).status).toBe(200);
    const resolvedAgain = await request(app)
      .patch(`/api/issues/${resolvedIssueId}`)
      .set(adminAuth)
      .send({ status: 'Resolved', priority: 'High' });
    expect(resolvedAgain.status).toBe(200);

    const closedIssueId = await createIssue('Closed status unchanged');
    expect((await request(app).patch(`/api/issues/${closedIssueId}`).set(adminAuth).send({ status: 'In Progress' })).status).toBe(200);
    expect((await request(app).patch(`/api/issues/${closedIssueId}`).set(adminAuth).send({ status: 'Resolved', resolution_notes: 'Repair completed' })).status).toBe(200);
    expect((await request(app).patch(`/api/issues/${closedIssueId}`).set(adminAuth).send({ status: 'Closed', resolution_notes: 'Closure verified' })).status).toBe(200);
    const closedAgain = await request(app)
      .patch(`/api/issues/${closedIssueId}`)
      .set(adminAuth)
      .send({ status: 'Closed', category: 'Furniture', resolution_notes: 'Closure verified' });
    expect(closedAgain.status).toBe(200);

    const resolvedTransitionId = await createIssue('In progress to resolved');
    expect((await request(app).patch(`/api/issues/${resolvedTransitionId}`).set(adminAuth).send({ status: 'In Progress' })).status).toBe(200);
    const resolved = await request(app)
      .patch(`/api/issues/${resolvedTransitionId}`)
      .set(adminAuth)
      .send({ status: 'Resolved', resolution_notes: 'Repair completed' });
    expect(resolved.status).toBe(200);

    const closeBeforeResolveId = await createIssue('In progress cannot close');
    expect((await request(app).patch(`/api/issues/${closeBeforeResolveId}`).set(adminAuth).send({ status: 'In Progress' })).status).toBe(200);
    const closeBeforeResolve = await request(app)
      .patch(`/api/issues/${closeBeforeResolveId}`)
      .set(adminAuth)
      .send({ status: 'Closed', resolution_notes: 'This should fail before resolution' });
    expect(closeBeforeResolve.status).toBe(400);

    const backwardFromResolvedId = await createIssue('Resolved cannot regress');
    expect((await request(app).patch(`/api/issues/${backwardFromResolvedId}`).set(adminAuth).send({ status: 'In Progress' })).status).toBe(200);
    expect((await request(app).patch(`/api/issues/${backwardFromResolvedId}`).set(adminAuth).send({ status: 'Resolved', resolution_notes: 'Repair completed' })).status).toBe(200);
    const backwardFromResolved = await request(app)
      .patch(`/api/issues/${backwardFromResolvedId}`)
      .set(adminAuth)
      .send({ status: 'In Progress' });
    expect(backwardFromResolved.status).toBe(400);

    const closedCannotRegressId = await createIssue('Closed cannot regress');
    expect((await request(app).patch(`/api/issues/${closedCannotRegressId}`).set(adminAuth).send({ status: 'In Progress' })).status).toBe(200);
    expect((await request(app).patch(`/api/issues/${closedCannotRegressId}`).set(adminAuth).send({ status: 'Resolved', resolution_notes: 'Repair completed' })).status).toBe(200);
    expect((await request(app).patch(`/api/issues/${closedCannotRegressId}`).set(adminAuth).send({ status: 'Closed', resolution_notes: 'Closure verified' })).status).toBe(200);
    const closedCannotRegress = await request(app)
      .patch(`/api/issues/${closedCannotRegressId}`)
      .set(adminAuth)
      .send({ status: 'Open' });
    expect(closedCannotRegress.status).toBe(400);
  });
});
