import { initializeDatabase } from '../db.js';
import { assertSeedData } from './validation.js';

await initializeDatabase();
const report = assertSeedData();
console.log(`Deterministic demo data seeded: ${report.users} users, ${report.issues} issues.`);
