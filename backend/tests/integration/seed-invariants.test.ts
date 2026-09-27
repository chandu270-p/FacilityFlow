import { beforeAll, describe, expect, it } from 'vitest';
import { initializeDatabase } from '../../src/db.js';
import { assertSeedData } from '../../src/seed/validation.js';

describe('seed invariants', () => {
  beforeAll(async () => {
    await initializeDatabase(':memory:');
  });

  it('contains the approved organization and issue totals', () => {
    const report = assertSeedData();

    expect(report.users).toBe(104);
    expect(report.employees).toBe(100);
    expect(report.administrators).toBe(4);
    expect(report.floors).toBe(8);
    expect(Object.values(report.employeesPerFloor).length).toBe(8);
    expect(Object.values(report.employeesPerFloor).reduce((sum, count) => sum + count, 0)).toBe(100);
    expect(report.issues).toBe(40);
    expect(Object.values(report.issuesPerFloor).reduce((sum, count) => sum + count, 0)).toBe(40);
    expect(report.valid).toBe(true);
  });
});
