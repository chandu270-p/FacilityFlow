import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { ADMIN_EMAIL_DOMAIN, EMPLOYEE_EMAIL_DOMAIN } from './auth/demo-config.js';

let sqlJs: SqlJsStatic | null = null;
let db: Database | null = null;

const wasmPath = fileURLToPath(new URL('../../node_modules/sql.js/dist/sql-wasm.wasm', import.meta.url));

const DATA_DIR = path.join(process.cwd(), 'backend', 'data');
const DB_FILE = path.join(DATA_DIR, 'facilityflow.db');

export async function loadSqlJs(): Promise<SqlJsStatic> {
  if (!sqlJs) {
    sqlJs = await initSqlJs({
      locateFile: (file: string) => (file === 'sql-wasm.wasm' ? wasmPath : file)
    });
  }
  return sqlJs;
}

export async function initializeDatabase(connectionString: string = DB_FILE): Promise<Database> {
  const SQL = await loadSqlJs();

  if (connectionString === ':memory:') {
    db = new SQL.Database();
  } else {
    fs.mkdirSync(path.dirname(connectionString), { recursive: true });
    if (fs.existsSync(connectionString)) {
      const fileBuffer = fs.readFileSync(connectionString);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
      fs.writeFileSync(connectionString, Buffer.from(db.export()));
    }
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      employee_id TEXT UNIQUE,
      name TEXT,
      email TEXT,
      department TEXT,
      floor INTEGER,
      role TEXT,
      status TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY,
      reporter_id INTEGER NOT NULL,
      assignee_id INTEGER,
      category TEXT,
      priority TEXT,
      status TEXT,
      description TEXT,
      created_at TEXT,
      updated_at TEXT,
      resolved_at TEXT,
      closed_at TEXT,
      resolution_notes TEXT,
      FOREIGN KEY(reporter_id) REFERENCES users(id),
      FOREIGN KEY(assignee_id) REFERENCES users(id)
    );
  `);

  const employeeEmailMigration = db.prepare(`UPDATE users SET email = REPLACE(email, '@facilityflow.demo', '@' || @domain) WHERE role = 'Employee'`);
  employeeEmailMigration.bind([EMPLOYEE_EMAIL_DOMAIN]);
  employeeEmailMigration.step();
  employeeEmailMigration.free();

  db.run(`UPDATE users SET name = 'Chandupriya' WHERE employee_id = 'EMP-01-01' AND role = 'Employee'`);

  const row = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM users`);
  if ((row?.count ?? 0) === 0) {
    seedDemoData();
  }

  if (connectionString !== ':memory:') {
    fs.writeFileSync(connectionString, Buffer.from(db.export()));
  }

  return db;
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function queryAll<T = Record<string, any>>(sql: string, params: Record<string, any> = {}): T[] {
  const statement = getDatabase().prepare(sql);
  if (Object.keys(params).length > 0) {
    statement.bind(Object.values(params));
  }

  const rows: T[] = [];
  while (statement.step()) {
    rows.push(statement.getAsObject() as T);
  }

  statement.free();
  return rows;
}

export function queryOne<T = Record<string, any>>(sql: string, params: Record<string, any> = {}): T | undefined {
  const rows = queryAll<T>(sql, params);
  return rows[0];
}

export function seedDemoData(): void {
  const database = getDatabase();

  const users: Array<{
    employee_id: string;
    name: string;
    email: string;
    department: string;
    floor: number;
    role: string;
    status: string;
  }> = [];

  const employeeDistribution = [13, 13, 13, 13, 12, 12, 12, 12];
  let employeeCounter = 1;

  for (let floor = 1; floor <= 8; floor += 1) {
    const employeeCount = employeeDistribution[floor - 1];
    for (let employeeIndex = 1; employeeIndex <= employeeCount; employeeIndex += 1) {
      users.push({
        employee_id: `EMP-${String(floor).padStart(2, '0')}-${String(employeeIndex).padStart(2, '0')}`,
        name: employeeCounter === 1 ? 'Chandupriya' : `Employee ${employeeCounter}`,
        email: `employee${employeeCounter}@${EMPLOYEE_EMAIL_DOMAIN}`,
        department: 'Operations',
        floor,
        role: 'Employee',
        status: 'Active'
      });
      employeeCounter += 1;
    }
  }

  for (let idx = 1; idx <= 4; idx += 1) {
    users.push({
      employee_id: `ADMIN-${idx}`,
      name: `Facility Administrator ${idx}`,
      email: `admin${idx}@${ADMIN_EMAIL_DOMAIN}`,
      department: 'Facilities',
      floor: idx,
      role: 'Facility Administrator',
      status: 'Active'
    });
  }

  const insertUser = database.prepare(`
    INSERT INTO users (employee_id, name, email, department, floor, role, status)
    VALUES (@employee_id, @name, @email, @department, @floor, @role, @status)
  `);

  for (const user of users) {
    insertUser.bind([
      user.employee_id,
      user.name,
      user.email,
      user.department,
      user.floor,
      user.role,
      user.status
    ]);
    insertUser.step();
    insertUser.reset();
  }

  const employeeRows = queryAll<{ id: number; floor: number }>(`SELECT id, floor FROM users WHERE role = 'Employee' ORDER BY id ASC`);
  const adminRows = queryAll<{ id: number }>(`SELECT id FROM users WHERE role = 'Facility Administrator' ORDER BY id ASC`);

  const issueInsert = database.prepare(`
    INSERT INTO issues (reporter_id, assignee_id, category, priority, status, description, created_at, updated_at, resolved_at, closed_at, resolution_notes)
    VALUES (@reporter_id, @assignee_id, @category, @priority, @status, @description, @created_at, @updated_at, @resolved_at, @closed_at, @resolution_notes)
  `);

  const categories = ['Electrical', 'HVAC', 'Plumbing', 'IT / Network', 'Furniture', 'Cleaning', 'Security', 'General Facilities'];
  const priorities = ['Low', 'Medium', 'High', 'Critical'];
  const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
  const issueNames = ['Air vent malfunction', 'Printer outage', 'Broken faucet', 'Elevator door alert', 'Dusty hallway', 'Door alarm issue'];
  const seedBase = Date.parse('2026-01-01T00:00:00.000Z');

  for (let i = 0; i < 40; i += 1) {
    const reporter = employeeRows[i % employeeRows.length];
    const assignee = i % 3 === 0 ? adminRows[i % adminRows.length] : null;
    const category = categories[i % categories.length];
    const priority = priorities[i % priorities.length];
    const status = statuses[i % statuses.length];
    const description = `${issueNames[i % issueNames.length]} ${i + 1}`;
    const timestamp = new Date(seedBase + i * 3600000).toISOString();
    const resolutionNotes = status === 'Resolved' || status === 'Closed' ? 'Resolution recorded for seeded issue' : null;

    issueInsert.bind([
      reporter.id,
      assignee ? assignee.id : null,
      category,
      priority,
      status,
      description,
      timestamp,
      timestamp,
      status === 'Resolved' || status === 'Closed' ? timestamp : null,
      status === 'Closed' ? timestamp : null,
      resolutionNotes
    ]);
    issueInsert.step();
    issueInsert.reset();
  }
}
