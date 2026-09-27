---

description: "Executable implementation tasks for the FacilityFlow issue tracker"
---

# Tasks: Facility Issue Tracker

**Input**: Design documents from `/specs/001-facility-issue-tracker/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/issue-api.md, contracts/ux.md, quickstart.md

**Tests**: Automated tests are required by the specification for issue creation, seed integrity, authentication, authorization, lifecycle validation, functional UX behavior, and end-to-end verification of both workspaces.

**Organization**: Tasks are grouped by user story so each increment has an independent goal and test criterion.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other marked tasks after listed prerequisites.
- **[Story]**: Required for user-story phases only; setup, foundational, and polish tasks omit it.
- Every task includes the concrete file path it owns or updates.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the existing local web application boundaries and test harness without creating a parallel application.

- [x] T001 [P] Confirm the implementation paths and existing entrypoints in `backend/src/app.ts`, `backend/src/server.ts`, `backend/src/db.ts`, `frontend/app.js`, `frontend/index.html`, and `frontend/styles.css` against `plan.md`; do not add obsolete `backend/src/api/`, `scripts/demo/`, or duplicate app directories.
- [x] T002 [P] Configure the existing TypeScript, Vitest, Supertest, and tsx commands in `package.json` and `tsconfig.json` for backend functional tests and frontend contract/UX verification.
- [x] T003 [P] Add the browser-level UX verification harness and its configuration in `frontend/tests/ux-acceptance.test.ts` and `playwright.config.ts`, covering desktop and narrow-mobile viewports without changing application business rules.
- [x] T004 [P] Document local demo startup and test entrypoints in `README.md` and `specs/001-facility-issue-tracker/quickstart.md`, including the separate company-email employee and administrator authentication paths.

## Phase 2: Foundational Tasks

**Purpose**: Preserve and verify the domain, persistence, seed, authentication, and backend authorization foundations required by every story.

- [x] T005 Define the exact issue vocabularies and lifecycle in `backend/src/domain/issue-domain.ts`: categories are "Electrical, HVAC, Plumbing, IT / Network, Furniture, Cleaning, Security, and General Facilities"; priorities are "Low, Medium, High, and Critical"; statuses are "Open, In Progress, Resolved, and Closed"; lifecycle is "Open → In Progress → Resolved → Closed"; invalid transitions and missing resolution data are rejected.
- [x] T006 [P] Define account and issue types in `backend/src/types.ts` and repository access in `backend/src/repositories/issue-repository.ts` for exactly 100 Employee-role accounts, exactly 4 Facility Administrators, exactly 104 total accounts, exactly 8 floors with flexible employee distribution, exactly 40 initial seeded issues, exactly one employee reporter per issue, and a null-or-administrator assignee.
- [x] T007 [P] Preserve persisted database initialization and deterministic seed generation in `backend/src/db.ts` for 100 Employee-role accounts, 4 Facility Administrators, 104 total accounts, 8 floors, and 40 initial issues while allowing additional employee-created issues to persist.
- [x] T008 [P] Implement seed validation in `backend/src/seed/validation.ts` and `backend/src/seed/index.ts` to prove reproducibility, employee reporters, administrator-only assignees, flexible floor distribution, no fixed per-employee or per-floor issue quota, and no legacy seed-count assumptions.
- [x] T009 [P] Preserve separate demo authentication configuration in `backend/src/auth/demo-config.ts` for complete fictional company-email Employee accounts and separate Facility Administrator credentials without real company identities or credentials.
- [x] T010 Implement backend session and role authorization boundaries in `backend/src/auth/authorization.ts` and `backend/src/app.ts` so role selection is verified against the provisioned account, protected requests require a valid session, and backend authorization remains authoritative over all UI gating.
- [x] T011 Implement shared issue retrieval and creation service contracts in `backend/src/services/issue-service.ts`, `backend/src/repositories/issue-repository.ts`, and `backend/src/app.ts` for list/detail access, required description, valid initial category and priority, default status, derived employee reporter, and database persistence.
- [x] T012 [P] Establish the shared frontend API and role-access boundaries in `frontend/src/services/issues-api.ts` and `frontend/src/services/role-access.ts` so UI restrictions are convenience behavior only and all errors, including HTTP 403, remain authoritative from the backend.

## Phase 3: User Story 1 - Employee submits a facility issue (P1)

**Goal**: Give employees a welcoming, low-friction workspace for reporting and following issues without exposing post-creation mutation controls.

**Independent Test**: A provisioned employee can log in with a complete fictional company email, see a contextual greeting, report an issue through the conversational flow, find it in the issue list, open its detail/status view, and cannot mutate restricted fields.

- [x] T013 [P] [US1] Add employee issue-creation and persistence coverage in `backend/tests/integration/issue-creation.test.ts` for valid login, required description, valid initial category and priority, default status, unique issue identifier, exactly one authenticated employee reporter, shared-list visibility, detail retrieval, and additional issues beyond the 40 seeded records.
- [x] T014 [P] [US1] Add employee seed-integrity coverage in `backend/tests/integration/seed-invariants.test.ts` for exactly 100 Employee-role accounts, exactly 4 Facility Administrators, 104 total accounts, exactly 8 floors with flexible distribution, exactly 40 initial issues, company-email employee accounts, and no fixed issue quota.
- [x] T015 [US1] Implement the employee workspace shell and contextual greeting in `frontend/src/pages/issues.ts` and `frontend/app.js`, identifying the Employee workspace and addressing the authenticated employee by name with calm, human, encouraging copy.
- [x] T016 [US1] Implement the prominent `Report an issue` action and conversational creation flow in `frontend/src/pages/issue-form.ts` and `frontend/app.js`, including human-language purpose copy, description, initial category, initial priority, validation feedback, accessible labels, and a clear success state.
- [x] T017 [US1] Implement the employee issue list and detail/status experience in `frontend/src/pages/issues.ts`, `frontend/src/components/issue-detail.ts`, and `frontend/src/components/issue-actions.ts`, showing submitted issues and current status while omitting assignment, resolution, closure, category-edit, priority-edit, and status-edit controls after creation.
- [x] T018 [US1] Apply the shared calm visual system to employee surfaces in `frontend/styles.css` and `frontend/index.html`: warm off-white/ivory foundation, soft charcoal typography, restrained warm accents, generous whitespace, clear hierarchy, subtle shadows, minimal borders, and gentle purposeful motion.
- [x] T019 [US1] Add automated employee workspace checks in `frontend/tests/ux-acceptance.test.ts` for the contextual greeting, prominent `Report an issue` action, conversational copy, issue list/detail/status visibility, absent restricted controls, keyboard focus, accessible labels, and responsive desktop/mobile rendering.
- [x] T020 [US1] Extend `backend/tests/e2e/demo-flow.test.ts` to verify the complete employee path from separate employee authentication through issue creation, persistence, shared visibility, and detail retrieval without administrator actions.

## Phase 4: User Story 2 - Facility Administrator manages issue lifecycle (P1)

**Goal**: Give administrators a focused operational workspace for finding, prioritizing, assigning, progressing, resolving, and closing issues through existing rules.

**Independent Test**: A Facility Administrator can authenticate separately, view all issues in an operational queue, search/filter the queue, progressively reveal controls for a selected issue, and move a valid issue through Open → In Progress → Resolved → Closed with required resolution information.

- [x] T021 [P] [US2] Add administrator lifecycle coverage in `backend/tests/integration/admin-lifecycle.test.ts` for all permitted category, priority, assignment, status, resolution, and close operations, including required resolution information and persistence.
- [x] T022 [P] [US2] Add administrator authentication and visibility coverage in `backend/tests/integration/authentication.test.ts` and `backend/tests/e2e/demo-flow.test.ts` for separate administrator credentials, role verification, and access to all issue records.
- [x] T023 [US2] Implement administrator issue mutation behavior in `backend/src/services/issue-service.ts`, `backend/src/repositories/issue-repository.ts`, and `backend/src/app.ts` for category, priority, nullable administrator assignment, status, resolution, and closure without changing the approved lifecycle or assignee constraints.
- [x] T024 [US2] Enforce lifecycle and resolution requirements in `backend/src/domain/issue-domain.ts` and `backend/src/services/issue-service.ts` so only Open → In Progress → Resolved → Closed succeeds, Open → Closed and Resolved → Open fail, and Resolved/Closed states require resolution information.
- [x] T025 [US2] Implement the dedicated administrator workspace and attention-oriented greeting in `frontend/src/pages/admin-dashboard.ts` and `frontend/app.js`, keeping administrator workflow hierarchy distinct from the employee reporting workspace.
- [x] T026 [US2] Implement the administrator operational queue in `frontend/src/pages/admin-dashboard.ts`, `frontend/src/pages/issues.ts`, and `frontend/src/components/issue-detail.ts` with visible status/priority signals, text search, status filtering, empty states, and responsive queue behavior.
- [x] T027 [US2] Implement progressive disclosure for administrator controls in `frontend/src/components/admin-issue-controls.ts`, `frontend/src/components/issue-actions.ts`, and `frontend/src/components/issue-detail.ts`, revealing assignment, category, priority, lifecycle, resolution, and closure controls only in the relevant selected-issue context.
- [x] T028 [US2] Apply the shared FacilityFlow identity and accessible responsive styling to administrator surfaces in `frontend/styles.css`, including keyboard focus, readable status feedback, mobile reflow, sufficient contrast, and reduced-motion behavior.
- [x] T029 [US2] Add automated administrator UX checks in `frontend/tests/ux-acceptance.test.ts` for workspace identity, attention greeting, queue search/filtering, status/priority visibility, progressive disclosure, keyboard access, accessible feedback, responsive layout, and reduced motion.
- [x] T030 [US2] Extend `backend/tests/e2e/demo-flow.test.ts` to verify the administrator path from separate login through queue retrieval, search/filter-compatible data access, valid lifecycle progression, resolution, closure, and rejection of an invalid transition.

## Phase 5: User Story 3 - Authorization enforces role boundaries (P1)

**Goal**: Ensure UI role gating improves clarity while backend authorization remains the sole authority and unauthorized requests never mutate data.

**Independent Test**: An authenticated employee cannot mutate restricted issue fields through the UI or direct API; each forbidden request returns HTTP 403 and the original issue remains unchanged, while an administrator can perform approved operations.

- [x] T031 [P] [US3] Add forbidden-mutation coverage in `backend/tests/integration/authorization.test.ts` and `backend/tests/integration/restricted-mutations.test.ts` for employee attempts to change category, priority, assignee, status, resolution, or closure, asserting HTTP 403 and unchanged records.
- [x] T032 [P] [US3] Add invalid-transition and validation coverage in `backend/tests/integration/authorization.test.ts` and `backend/tests/integration/admin-lifecycle.test.ts` for Open → Closed, Resolved → Open, close-before-resolve, missing resolution, invalid enums, and missing descriptions.
- [x] T033 [US3] Enforce backend-authoritative role checks in `backend/src/auth/authorization.ts`, `backend/src/app.ts`, and `backend/src/services/issue-service.ts` so manipulated client state cannot grant administrator permissions and rejected writes occur before persistence.
- [x] T034 [US3] Implement UI-level role gating in `frontend/src/services/role-access.ts`, `frontend/src/components/issue-actions.ts`, `frontend/src/components/admin-issue-controls.ts`, and `frontend/src/components/issue-detail.ts` so employees see read-only details and administrators see only relevant controls, while preserving direct backend enforcement.
- [x] T035 [US3] Add frontend authorization feedback checks in `frontend/tests/ux-acceptance.test.ts` to confirm hidden or disabled employee controls cannot be mistaken for permission enforcement, HTTP 403 and invalid-transition errors are accessible, and failed writes do not appear as successful local updates.
- [x] T036 [US3] Add cross-role end-to-end verification in `backend/tests/e2e/demo-flow.test.ts` and `frontend/tests/ux-acceptance.test.ts` covering both workspaces, role-specific control visibility, direct-request rejection, unchanged records, and shared FacilityFlow identity.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Complete traceability, accessibility evidence, deterministic validation, and demo readiness without changing business rules.

- [x] T037 [P] Run accessibility checks for labels, headings, status announcements, focus order, keyboard operation, contrast, and reduced motion in `frontend/tests/ux-acceptance.test.ts` and record the evidence in `specs/001-facility-issue-tracker/quickstart.md`.
- [x] T038 [P] Run responsive acceptance checks at desktop and narrow-mobile viewports for both workspaces in `frontend/tests/ux-acceptance.test.ts`, confirming core actions remain reachable without blocking overflow.
- [x] T039 [P] Verify shared visual identity and restrained hierarchy across `frontend/index.html`, `frontend/app.js`, `frontend/styles.css`, and `specs/001-facility-issue-tracker/contracts/ux.md` without adding excessive KPI cards, dense dashboard controls, excessive gradients, or excessive animation.
- [x] T040 Run the complete automated suite with `npm test` and TypeScript validation with `npm run build`, recording results in `specs/001-facility-issue-tracker/quickstart.md`.
- [x] T041 Run deterministic seed verification from `backend/src/seed/index.ts` and `backend/src/seed/validation.ts`, proving 100 Employee-role accounts, 4 Facility Administrators, 104 total accounts, 8 floors with flexible distribution, 40 initial issues, persistent additional issues, and no obsolete seed assumptions.
- [x] T042 Update `README.md` and `specs/001-facility-issue-tracker/quickstart.md` with the independent test criteria, both workspace flows, backend authorization expectations, and the final automated/manual validation commands.
- [x] T043 Review all implementation tasks and `specs/001-facility-issue-tracker/contracts/ux.md` for scope control, confirming no new roles, issue categories, priorities, statuses, lifecycle transitions, assignment targets, quotas, or seed totals were introduced.

## Dependencies

- Phase 1 precedes Phase 2 because the test and repository boundaries must be known before implementation tasks are executed.
- Phase 2 precedes all stories because shared domain validation, persistence, seed invariants, authentication, authorization, and API contracts are blocking prerequisites.
- User Story 1 is the MVP and establishes employee issue creation, persistence, list/detail/status behavior, and the shared visual foundation.
- User Story 2 depends on the issue creation and shared issue contracts from User Story 1, then adds administrator operations and queue behavior.
- User Story 3 depends on the role boundaries and issue mutation paths from User Stories 1 and 2, then proves backend rejection and UI gating together.
- Polish tasks depend on the completed story behavior but can run in parallel with one another after the relevant story surfaces exist.

## Parallel Execution Examples

- After Phase 2: T013, T014, T015, and T018 can run in parallel because they own separate employee tests, seed tests, employee composition, and shared visual styling.
- After T021 and T023 establish the administrator API shape: T022, T025, T026, and T028 can run in parallel across authentication/E2E, workspace composition, queue behavior, and styling.
- After the backend mutation paths exist: T031, T032, T034, and T035 can run in parallel across backend rejection tests, lifecycle edge cases, UI gating, and frontend feedback tests.
- After both workspaces exist: T037, T038, and T039 can run in parallel as accessibility, responsive, and visual-identity checks.

## Implementation Strategy

- **MVP**: Complete Phase 1, Phase 2, and User Story 1, including employee authentication, persistent issue creation, list/detail/status experience, seed integrity, and the shared visual foundation.
- **Operational increment**: Complete User Story 2 to add the administrator queue, search/filtering, progressive disclosure, lifecycle management, and end-to-end administrator verification.
- **Security increment**: Complete User Story 3 to prove UI role gating never replaces backend authorization and every forbidden employee mutation returns HTTP 403 without changing data.
- **Release readiness**: Complete Phase 6 to validate accessibility, responsive behavior, shared identity, deterministic seed output, full tests/build, and scope preservation.

## Completion Criteria

- All tasks use the required `- [ ]` or `- [x]` checklist format with `T###`, optional `[P]`, optional story label, and a concrete file path.
- Each P1 user story has a stated independent test criterion and automated verification tasks.
- Both workspaces are covered end to end, including role-specific UI gating and backend authorization.
- The approved account, floor, seed issue, authentication, persistence, assignee, and lifecycle requirements remain unchanged.
- No legacy seed-count or fixed-quota assumptions remain in the task list.
