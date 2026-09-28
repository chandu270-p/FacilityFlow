# Quickstart Validation Guide

## Prerequisites

- Node.js 20 LTS or later
- npm or pnpm for local dependency installation
- A local browser for demo checks
- Seed data generation enabled in the demo environment

## Setup

1. Install dependencies with `npm install`.
2. Validate and seed the demo dataset with `npm run seed`.
3. Start the local application with `npm start`.
4. Open `http://localhost:3000` in a browser.

Use the complete provisioned company email and select the matching role on the login page. Employee demo records use the configurable company-email boundary; this is a future corporate SSO/Entra ID boundary, not a real corporate password validation. Administrator demo records remain on `facilityflow.demo`. Credential hashes are supplied by the local environment; administrator credentials are intentionally not displayed or returned by the application.

## Validation Scenarios

### 1. Employee issue creation

- Log in as a seeded employee.
- Create a new facility issue with a valid category and priority.
- Confirm the issue appears in the shared issue list and details view.
- Confirm the employee cannot modify category, priority, assignment, status, or resolution after creation.

Expected result: issue is created successfully, appears in list and details, and all employee mutation attempts fail with backend enforcement.

### 2. Facility admin lifecycle management

- Log in as a facility administrator.
- Open the issue list and verify all issues are visible.
- Update category, priority, assignee, status, and resolution as permitted.
- Move an issue through the valid lifecycle: Open → In Progress → Resolved → Closed.

Expected result: all admin actions succeed and invalid transitions are rejected.

### 3. Seed integrity validation

- Run the defined seed verification checks.
- Confirm the system contains 104 accounts total: 100 Employee-role accounts and 4 administrators, across 8 floors, with exactly 40 initial issues.
- Confirm floor distribution is valid without requiring equal employee counts and that no fixed issue quota is imposed on employees or floors.
- Confirm every issue reporter is an employee and every assignee is null or a facility administrator.
- Create an additional employee issue and confirm it persists in the database.

Expected result: all seeded invariants validate successfully.

The reusable validation is also exercised by `backend/tests/integration/seed-invariants.test.ts`.

### 4. Unauthorized modification rejection

- As an employee, attempt to POST or PATCH a restricted field using direct API requests or manipulated client state.
- Observe the backend response.

Expected result: HTTP 403 is returned and the issue remains unchanged.

### 5. Employee workspace UX

- Log in with a provisioned Employee account at a desktop viewport and a narrow mobile viewport.
- Confirm the page identifies the Employee workspace and presents a contextual greeting using the logged-in employee's name.
- Confirm `Report an issue` is the most prominent employee action and opens a short conversational flow with human-readable purpose copy.
- Submit an issue and confirm it appears in the employee's issue list with current status and a detail view.
- Confirm employee detail views expose progress information but do not expose assignment, resolution, closure, or other restricted mutation controls.
- Use keyboard navigation to reach the report action, form fields, issue list, and detail view; confirm focus is visible and labels are understandable.

Expected result: the employee can report and follow an issue with low visual noise, clear hierarchy, responsive layout, and no client-side bypass of backend authorization.

### 6. Administrator workspace UX

- Log in with a provisioned Facility Administrator account at a desktop viewport and a narrow mobile viewport.
- Confirm the page identifies the Administrator workspace and presents an attention-oriented operational greeting.
- Confirm the issue queue exposes useful status and priority information, supports text search, and supports status filtering.
- Select an issue and confirm administrator controls are revealed in the relevant detail context rather than displayed as an undifferentiated control wall.
- Exercise permitted category, priority, assignment, status, resolution, and closure actions through the existing API workflow.
- Attempt an invalid lifecycle transition and confirm the backend rejects it while the interface reports the failure without corrupting the issue.
- Enable reduced motion and confirm non-essential transitions are reduced or removed.

Expected result: the administrator can scan, find, and manage issues efficiently while the workspace remains calm, responsive, accessible, and faithful to backend rules.

### 7. Shared product identity

- Compare the authenticated Employee and Facility Administrator workspaces.
- Confirm both use the same FacilityFlow brand, typography, color tokens, spacing language, focus treatment, and status vocabulary.
- Confirm their primary actions and information hierarchy remain distinct: reporting/follow-up for employees and queue management/lifecycle operations for administrators.
- Confirm no UX change introduces additional roles, statuses, categories, assignment targets, issue quotas, or seed totals.

Expected result: both workspaces feel like one product with different responsibilities and preserve the approved domain model.

## Expected Outcomes

- Issue creation works for seeded employees.
- Facility administrators can manage the lifecycle and closure process.
- The seeded dataset and lifecycle rules remain deterministic and testable.
- Authorization boundaries are preserved at the server layer.
- Employee and administrator workspace acceptance checks pass at desktop and mobile widths with accessible interaction and restrained motion.

## Verification Commands

```text
npm test
npm run test:ux
npm run build
```

The committed suite covers seed invariants, demo authentication, administrator lifecycle management, assignee constraints, restricted employee mutations, the employee-to-administrator demo flow, and frontend UX checks. `npm run test:ux` runs 8 Playwright tests across desktop and narrow-mobile Chromium projects, including Axe accessibility checks, keyboard focus, reduced motion, and horizontal-overflow checks. The current verification result is 7 Vitest files with 18 tests passed, 8 Playwright tests passed, followed by a successful TypeScript build. Manual review may additionally cover `contracts/ux.md` and scenarios 5 through 7 above.
