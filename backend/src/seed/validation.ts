import { queryAll } from '../db.js';
import { ISSUE_CATEGORIES, ISSUE_PRIORITIES, ISSUE_STATUSES } from '../domain/issue-domain.js';
import { ADMIN_EMAIL_DOMAIN, EMPLOYEE_EMAIL_DOMAIN } from '../auth/demo-config.js';
import type { IssueRecord, UserRecord } from '../types.js';

export interface SeedValidationReport {
  users: number;
  employees: number;
  administrators: number;
  floors: number;
  employeesPerFloor: Record<number, number>;
  issues: number;
  issuesPerEmployee: Record<number, number>;
  issuesPerFloor: Record<number, number>;
  categories: string[];
  priorities: string[];
  statuses: string[];
  valid: boolean;
  errors: string[];
}

export function validateSeedData(): SeedValidationReport {
  const users = queryAll<UserRecord>('SELECT * FROM users ORDER BY id ASC');
  const issues = queryAll<IssueRecord>('SELECT * FROM issues ORDER BY id ASC');
  const employees = users.filter((user) => user.role === 'Employee');
  const administrators = users.filter((user) => user.role === 'Facility Administrator');
  const employeesPerFloor: Record<number, number> = {};
  const issuesPerEmployee: Record<number, number> = {};
  const issuesPerFloor: Record<number, number> = {};
  const errors: string[] = [];
  const userById = new Map(users.map((user) => [user.id, user]));

  for (const employee of employees) {
    employeesPerFloor[employee.floor] = (employeesPerFloor[employee.floor] ?? 0) + 1;
  }

  for (const issue of issues) {
    const reporter = userById.get(issue.reporter_id);
    if (!reporter || reporter.role !== 'Employee') {
      errors.push(`Issue ${issue.id} has a non-employee reporter`);
      continue;
    }
    issuesPerEmployee[issue.reporter_id] = (issuesPerEmployee[issue.reporter_id] ?? 0) + 1;
    issuesPerFloor[reporter.floor] = (issuesPerFloor[reporter.floor] ?? 0) + 1;

    if (issue.assignee_id !== null) {
      const assignee = userById.get(issue.assignee_id);
      if (!assignee || assignee.role !== 'Facility Administrator') {
        errors.push(`Issue ${issue.id} has an invalid assignee`);
      }
    }

    if ((issue.status === 'Resolved' || issue.status === 'Closed') && !issue.resolution_notes) {
      errors.push(`Issue ${issue.id} is ${issue.status} without resolution information`);
    }
  }

  const categories = [...new Set(issues.map((issue) => issue.category))].sort();
  const priorities = [...new Set(issues.map((issue) => issue.priority))].sort();
  const statuses = [...new Set(issues.map((issue) => issue.status))].sort();
  const expectedCategories = [...ISSUE_CATEGORIES].sort();
  const expectedPriorities = [...ISSUE_PRIORITIES].sort();
  const expectedStatuses = [...ISSUE_STATUSES].sort();
  const same = (actual: string[], expected: string[]) => JSON.stringify(actual) === JSON.stringify(expected);

  if (users.length !== 104) errors.push(`Expected 104 users, found ${users.length}`);
  if (employees.length !== 100) errors.push(`Expected 100 employees, found ${employees.length}`);
  if (administrators.length !== 4) errors.push(`Expected 4 administrators, found ${administrators.length}`);
  if (Object.keys(employeesPerFloor).length !== 8) errors.push('Expected exactly 8 floors');
  if (Object.values(employeesPerFloor).reduce((sum, count) => sum + count, 0) !== 100) errors.push('Expected the employee roster to total 100 across 8 floors');
  if (employees.some((user) => !user.email.endsWith(`@${EMPLOYEE_EMAIL_DOMAIN}`))) errors.push('Found an employee without a configured company email domain');
  if (administrators.some((user) => !user.email.endsWith(`@${ADMIN_EMAIL_DOMAIN}`))) errors.push('Found an administrator without the facilityflow.demo domain');
  if (issues.length !== 40) errors.push(`Expected 40 issues, found ${issues.length}`);
  if (Object.values(issuesPerFloor).reduce((sum, count) => sum + count, 0) !== 40) errors.push('Expected the seeded issue set to total 40 across all reporter floors');
  if (!same(categories, expectedCategories)) errors.push('Issue categories do not match the approved domain');
  if (!same(priorities, expectedPriorities)) errors.push('Issue priorities do not match the approved domain');
  if (!same(statuses, expectedStatuses)) errors.push('Issue statuses do not match the approved domain');

  return {
    users: users.length,
    employees: employees.length,
    administrators: administrators.length,
    floors: Object.keys(employeesPerFloor).length,
    employeesPerFloor,
    issues: issues.length,
    issuesPerEmployee,
    issuesPerFloor,
    categories,
    priorities,
    statuses,
    valid: errors.length === 0,
    errors
  };
}

export function assertSeedData(): SeedValidationReport {
  const report = validateSeedData();
  if (!report.valid) {
    throw new Error(report.errors.join('; '));
  }
  return report;
}
