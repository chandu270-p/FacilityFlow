import { getDatabase, queryAll, queryOne } from '../db.js';
import {
  isResolutionRequiredForState,
  isValidCategory,
  isValidLifecycleTransition,
  isValidPriority,
  isValidStatus
} from '../domain/issue-domain.js';
import type { IssueCreateInput, IssueRecord, Role, UserRecord } from '../types.js';

export function getSharedIssues(): IssueRecord[] {
  return queryAll<IssueRecord>(`SELECT * FROM issues ORDER BY id ASC`);
}

export function createIssue(input: IssueCreateInput, role: Role): IssueRecord {
  if (role !== 'Employee') {
    throw Object.assign(new Error('Only employees can create issues'), { status: 403 });
  }

  if (!input.description || !input.description.trim()) {
    throw Object.assign(new Error('Description is required'), { status: 400 });
  }

  if (!isValidCategory(input.category)) {
    throw Object.assign(new Error('Invalid category'), { status: 400 });
  }

  if (!isValidPriority(input.priority)) {
    throw Object.assign(new Error('Invalid priority'), { status: 400 });
  }

  const reporter = queryOne<UserRecord>(`SELECT * FROM users WHERE id = @id`, { id: input.reporterId });
  if (!reporter || reporter.role !== 'Employee') {
    throw Object.assign(new Error('Reporter must be an employee'), { status: 400 });
  }

  const db = getDatabase();
  const ts = new Date().toISOString();
  const statement = db.prepare(`
    INSERT INTO issues (reporter_id, assignee_id, category, priority, status, description, created_at, updated_at, resolved_at, closed_at, resolution_notes)
    VALUES (@reporter_id, @assignee_id, @category, @priority, @status, @description, @created_at, @updated_at, @resolved_at, @closed_at, @resolution_notes)
  `);
  statement.bind([
    input.reporterId,
    null,
    input.category,
    input.priority,
    'Open',
    input.description,
    ts,
    ts,
    null,
    null,
    null
  ]);
  statement.step();
  statement.free();

  const issue = queryOne<IssueRecord>(`SELECT * FROM issues ORDER BY id DESC LIMIT 1`);
  return issue as IssueRecord;
}

export function getIssueById(id: number): IssueRecord | undefined {
  return queryOne<IssueRecord>(`SELECT * FROM issues WHERE id = @id`, { id });
}

export function updateIssue(id: number, patch: Partial<IssueRecord>, role: Role): IssueRecord {
  const existing = getIssueById(id);
  if (!existing) {
    throw Object.assign(new Error('Issue not found'), { status: 404 });
  }

  if (role !== 'Facility Administrator') {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  const allowedFields = ['category', 'priority', 'assignee_id', 'status', 'resolved_at', 'closed_at', 'resolution_notes'];
  const changes: Record<string, unknown> = { updated_at: new Date().toISOString() };

  for (const [key, value] of Object.entries(patch)) {
    if (allowedFields.includes(key) && value !== undefined) {
      changes[key] = value;
    }
  }

  if (typeof changes.status === 'string' && !isValidStatus(changes.status as string)) {
    throw Object.assign(new Error('Invalid status'), { status: 400 });
  }

  if (typeof changes.category === 'string' && !isValidCategory(changes.category)) {
    throw Object.assign(new Error('Invalid category'), { status: 400 });
  }

  if (typeof changes.priority === 'string' && !isValidPriority(changes.priority)) {
    throw Object.assign(new Error('Invalid priority'), { status: 400 });
  }

  if (changes.assignee_id !== null && changes.assignee_id !== undefined) {
    const assignee = queryOne<UserRecord>(`SELECT * FROM users WHERE id = @id`, { id: Number(changes.assignee_id) });
    if (!assignee || assignee.role !== 'Facility Administrator') {
      throw Object.assign(new Error('Assignee must be a Facility Administrator'), { status: 400 });
    }
  }

  const nextStatus = typeof changes.status === 'string' ? changes.status : existing.status;
  const nextResolutionNotes = typeof changes.resolution_notes === 'string' ? changes.resolution_notes : (existing.resolution_notes ?? '');

  if (existing.status && changes.status && !isValidLifecycleTransition(existing.status, String(changes.status))) {
    throw Object.assign(new Error('Invalid lifecycle transition'), { status: 400 });
  }

  if ((nextStatus === 'Resolved' || nextStatus === 'Closed') && (!nextResolutionNotes || !nextResolutionNotes.trim())) {
    throw Object.assign(new Error('Resolution required'), { status: 400 });
  }

  if (nextStatus === 'Closed' && existing.status !== 'Resolved' && existing.status !== 'Closed' && !changes.resolved_at) {
    throw Object.assign(new Error('Issue must be resolved before closure'), { status: 400 });
  }

  if (nextStatus === 'Resolved' && !changes.resolved_at) {
    changes.resolved_at = new Date().toISOString();
  }

  if (nextStatus === 'Closed' && !changes.closed_at) {
    changes.closed_at = new Date().toISOString();
  }

  const db = getDatabase();
  const sql = Object.keys(changes)
    .map((key) => `${key} = @${key}`)
    .join(', ');

  const statement = db.prepare(`UPDATE issues SET ${sql} WHERE id = @id`);
  statement.bind([...Object.keys(changes).map((key) => changes[key]), id] as any[]);
  statement.step();
  statement.free();

  const updated = getIssueById(id);
  if (!updated) {
    throw Object.assign(new Error('Issue not found after update'), { status: 500 });
  }
  return updated;
}

export function rejectEmployeeMutation(id: number, patch: Partial<IssueRecord>, role: Role): void {
  if (role === 'Employee') {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  updateIssue(id, patch, role);
}
