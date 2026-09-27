import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import type { Role } from '../types.js';

const requireEnvironmentVariable = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const EMPLOYEE_PASSWORD_HASH = requireEnvironmentVariable('FACILITYFLOW_EMPLOYEE_PASSWORD_HASH');
const ADMIN_PASSWORD_HASH = requireEnvironmentVariable('FACILITYFLOW_ADMIN_PASSWORD_HASH');
const SESSION_SECRET = requireEnvironmentVariable('FACILITYFLOW_SESSION_SECRET');
const ALLOW_LEGACY_ROLE_HEADER = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true' || process.env.FACILITYFLOW_ALLOW_LEGACY_ROLE_HEADER === 'true';

type DemoToken = { id: number; role: Role; employeeId: string; name: string };

export function verifyDemoPassword(password: string, role: Role): boolean {
  const expectedHash = role === 'Facility Administrator' ? ADMIN_PASSWORD_HASH : EMPLOYEE_PASSWORD_HASH;
  const actualHash = crypto.createHash('sha256').update(password).digest('hex');
  if (expectedHash.length !== actualHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(actualHash), Buffer.from(expectedHash));
}

export function createDemoToken(user: DemoToken): string {
  const payload = Buffer.from(JSON.stringify(user), 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function readDemoToken(req: Request): DemoToken | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return undefined;
  }

  try {
    const [payload, signature] = header.slice(7).split('.');
    if (!payload || !signature) return undefined;
    const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
    if (signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return undefined;
    const token = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as DemoToken;
    if (!token.id || !token.role || !token.employeeId || !token.name) {
      return undefined;
    }
    return token;
  } catch {
    return undefined;
  }
}

export function requireRole(role: Role | Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const tokenUser = readDemoToken(req);
    const legacyRole = ALLOW_LEGACY_ROLE_HEADER ? (req.headers['x-user-role'] as string | undefined)?.trim() : undefined;
    const requestRole = tokenUser?.role ?? legacyRole;
    const allowedRoles = Array.isArray(role) ? role : [role];

    if (!requestRole || !allowedRoles.includes(requestRole as Role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.user = tokenUser ?? { id: 1, role: requestRole as Role, employeeId: 'EMP-01-01', name: 'Chandupriya' };
    next();
  };
}

export function canMutateIssue(req: Request, isEmployeeUser: boolean): boolean {
  if (!req.user) {
    return false;
  }

  return !isEmployeeUser || req.user.role === 'Facility Administrator';
}
