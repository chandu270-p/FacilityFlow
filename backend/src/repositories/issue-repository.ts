import { queryAll, queryOne } from '../db.js';
import type { IssueRecord } from '../types.js';

export function listIssues(): IssueRecord[] {
  return queryAll<IssueRecord>(`SELECT * FROM issues ORDER BY id ASC`);
}

export function findIssueById(id: number): IssueRecord | undefined {
  return queryOne<IssueRecord>(`SELECT * FROM issues WHERE id = @id`, { id });
}
