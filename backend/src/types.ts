export type Role = 'Employee' | 'Facility Administrator';

export type IssueCategory =
  | 'Electrical'
  | 'HVAC'
  | 'Plumbing'
  | 'IT / Network'
  | 'Furniture'
  | 'Cleaning'
  | 'Security'
  | 'General Facilities';

export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type IssueStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface UserRecord {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  department: string;
  floor: number;
  role: Role;
  status: string;
}

export interface IssueRecord {
  id: number;
  reporter_id: number;
  assignee_id: number | null;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  description: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  resolution_notes: string | null;
}

export interface IssueCreateInput {
  reporterId: number;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
}

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role: Role; employeeId: string; name: string };
    }
  }
}

export {};
