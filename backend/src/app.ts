import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import path from 'node:path';
import { initializeDatabase } from './db.js';
import { createDemoToken, requireRole, verifyDemoPassword } from './auth/authorization.js';
import { createIssue, getIssueById, getSharedIssues, updateIssue } from './services/issue-service.js';
import { isValidCategory, isValidPriority } from './domain/issue-domain.js';
import { queryAll, queryOne } from './db.js';
import type { UserRecord } from './types.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'frontend')));

initializeDatabase(':memory:');

function getRole(req: Request): 'Employee' | 'Facility Administrator' {
  const role = req.user?.role ?? String(req.headers['x-user-role'] ?? 'Employee');
  return role === 'Facility Administrator' ? 'Facility Administrator' : 'Employee';
}

app.get('/', (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'frontend', 'index.html'));
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const requestedRole = String(req.body?.role ?? '').trim() as UserRecord['role'];
  const password = String(req.body?.password ?? '');

  if (!email || !password || !['Employee', 'Facility Administrator'].includes(requestedRole)) {
    return res.status(401).json({ error: 'Invalid credentials or role selection' });
  }

  const user = queryOne<UserRecord>(`SELECT * FROM users WHERE LOWER(email) = @email`, { email });
  if (!user) {
    return res.status(401).json({ error: 'Invalid demo credentials' });
  }

  if (user.role !== requestedRole) {
    return res.status(403).json({ error: 'Selected role does not match this account' });
  }

  if (!verifyDemoPassword(password, user.role)) {
    return res.status(401).json({ error: 'Invalid demo credentials' });
  }

  const session = { id: user.id, role: user.role, employeeId: user.employee_id, name: user.name };
  return res.status(200).json({ token: createDemoToken(session), user: session });
});

app.get('/api/auth/me', requireRole(['Employee', 'Facility Administrator']), (req, res) => {
  return res.status(200).json({ user: req.user });
});

app.get('/api/users', requireRole('Facility Administrator'), (_req, res) => {
  const users = queryAll<UserRecord>(`SELECT * FROM users ORDER BY role DESC, id ASC`);
  return res.status(200).json({ users });
});

app.get('/api/issues', requireRole(['Employee', 'Facility Administrator']), (req, res) => {
  const issues = getSharedIssues();
  res.status(200).json({ issues });
});

app.get('/api/issues/:id', requireRole(['Employee', 'Facility Administrator']), (req, res) => {
  const issue = getIssueById(Number(req.params.id));
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  return res.status(200).json({ issue });
});

app.post('/api/issues', requireRole('Employee'), (req, res) => {
  try {
    const role = getRole(req);
    const body = req.body ?? {};
    if (!body.description || !body.description.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }
    if (!isValidCategory(String(body.category))) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    if (!isValidPriority(String(body.priority))) {
      return res.status(400).json({ error: 'Invalid priority' });
    }

    const issue = createIssue({
      reporterId: req.user?.id ?? Number(body.reporterId ?? 1),
      description: String(body.description),
      category: String(body.category) as any,
      priority: String(body.priority) as any
    }, role);

    return res.status(201).json({ issue });
  } catch (error: any) {
    return res.status(error.status ?? 500).json({ error: error.message ?? 'Unexpected error' });
  }
});

app.patch('/api/issues/:id', requireRole(['Employee', 'Facility Administrator']), (req, res) => {
  const role = getRole(req);
  try {
    const existingIssue = getIssueById(Number(req.params.id));
    if (!existingIssue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    if (role === 'Employee') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const update = req.body ?? {};
    const nextIssue = updateIssue(Number(req.params.id), update, role);
    return res.status(200).json({ issue: nextIssue });
  } catch (error: any) {
    return res.status(error.status ?? 500).json({ error: error.message ?? 'Unexpected error' });
  }
});

app.post('/api/issues/:id/resolve', requireRole('Facility Administrator'), (req, res) => {
  try {
    const issueId = Number(req.params.id);
    const issue = getIssueById(issueId);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const resolutionNotes = String(req.body?.resolution_notes ?? '').trim();
    if (!resolutionNotes) {
      return res.status(400).json({ error: 'Resolution required' });
    }

    const nextIssue = updateIssue(issueId, {
      status: 'Resolved',
      resolution_notes: resolutionNotes,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, 'Facility Administrator');
    return res.status(200).json({ issue: nextIssue });
  } catch (error: any) {
    return res.status(error.status ?? 500).json({ error: error.message ?? 'Unexpected error' });
  }
});

app.post('/api/issues/:id/close', requireRole('Facility Administrator'), (req, res) => {
  try {
    const issueId = Number(req.params.id);
    const issue = getIssueById(issueId);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    if (issue.status !== 'Resolved') {
      return res.status(400).json({ error: 'Issue must be resolved before it can be closed' });
    }

    const resolutionNotes = String(req.body?.resolution_notes ?? issue.resolution_notes ?? '').trim();
    if (!resolutionNotes) {
      return res.status(400).json({ error: 'Resolution required' });
    }

    const nextIssue = updateIssue(issueId, {
      status: 'Closed',
      resolution_notes: resolutionNotes,
      closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, 'Facility Administrator');
    return res.status(200).json({ issue: nextIssue });
  } catch (error: any) {
    return res.status(error.status ?? 500).json({ error: error.message ?? 'Unexpected error' });
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: err.message });
});

export default app;
