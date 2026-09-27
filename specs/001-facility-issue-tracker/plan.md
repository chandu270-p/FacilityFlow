# Implementation Plan: Facility Issue Tracker

**Branch**: `001-facility-issue-tracker` | **Date**: 2026-09-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-facility-issue-tracker/spec.md`

## Summary

Implement and reconcile a small, local-demo web application for tracking workplace facility issues from employee reporting through administrator resolution and closure. The solution centers on deterministic demo data, strict role-based authorization, lifecycle validation, and two intentionally distinct but visually related workspaces so the system supports SME demonstration and test automation without production-grade dependencies.

The design will keep the application intentionally narrow: pre-provisioned Employee-role and Facility Administrator accounts, a shared issue list and detail view, a dedicated employee reporting workspace, a dedicated administrator operational queue, server-side authorization for all mutations, and a seeded dataset that enforces exactly 104 accounts and 40 initial issues while allowing additional persistent employee-created issues. The visual system will use a warm off-white/ivory foundation, soft charcoal typography, restrained warm accents, generous whitespace, minimal borders, subtle shadows, and gentle motion. UX improvements must not create new business rules or weaken backend enforcement.

## Technical Context

**Language/Version**: TypeScript 5.x with Node.js 20 LTS

**Primary Dependencies**: Express for the API layer, the existing lightweight browser frontend without a required UI framework, sql.js for local SQLite-compatible deterministic storage, and Vitest + Supertest for role, lifecycle, seed, and API validation.

**Storage**: SQLite-compatible local storage through sql.js, with deterministic seed scripts generating 100 Employee-role accounts, 4 Facility Administrator accounts, and 40 initial issues on each clean seed. Newly created issues persist in the database.

**Testing**: Automated integration and end-to-end validation focused on 104-account seed integrity, 40 initial issues, employee-created persistence, forbidden mutations, lifecycle transitions, role authentication, and authorization enforcement, plus browser-level or manual acceptance checks for workspace separation, responsive layout, accessibility, search/filtering, progressive disclosure, and the primary employee reporting flow.

**Target Platform**: Local browser-based demo environment for SME and AI-in-Action use; no production deployment or external identity system required.

**Project Type**: Web application

**Performance Goals**: Handle the seeded demo dataset (104 accounts, 40 initial issues) comfortably in local use, with additional issue creation and administrator lifecycle actions completing in normal demo timeframes and without background services.

**Constraints**: Demo-only local execution, no real employee identities or credentials, strict backend authorization for every write path, fixed issue domains and lifecycle rules, deterministic seed output for repeated validation, responsive behavior at desktop and narrow mobile widths, accessible keyboard/focus/label semantics, restrained motion, and no UI requirement that changes the approved domain model.

**Scale/Scope**: One workplace facility model with 8 floors, 100 Employee-role accounts, 4 Facility Administrators, and a shared issue tracker whose account model supports adding employees later without redesigning authentication or authorization.

**Implementation Approach**:

1. Preserve the existing backend, authentication boundary, authorization middleware, issue domain/service, persistence, seed validation, and automated tests.
2. Shape the frontend around role-specific workspace composition: employees receive a contextual greeting, prominent `Report an issue` action, conversational issue creation, and clear submitted issue status/detail views; administrators receive a focused operational queue with search, status/priority filtering, and progressive disclosure for mutation controls.
3. Centralize the shared visual language in the existing frontend styling and components so both roles feel like FacilityFlow while retaining distinct information hierarchy and action surfaces.
4. Validate UX behavior against the UX contract and quickstart scenarios without introducing additional statuses, roles, quotas, assignment rules, or lifecycle transitions.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Purpose & Scope: PASS — The feature supports operational facility issue management and measurable service outcomes.
- Evidence Before Execution: PASS — The spec defines measurable acceptance criteria, seeded invariants, and lifecycle validation.
- Security & Data Integrity: PASS — Backend authorization is mandatory, role selection is verified against provisioned account roles, restricted field writes are rejected with HTTP 403, and assignee rules are enforced.
- Testability & Quality: PASS — The feature demands deterministic seed validation, independent role tests, and lifecycle regression checks.
- Simplicity, Maintainability, and Improvement: PASS — The design keeps a single, bounded facility issue domain and avoids unnecessary integrations.
- Operational Constraints: PASS — The solution is local/demo-only and avoids production-grade identity or external integrations.
- Governance: PASS — The design remains traceable to the constitution and is suitable for demonstration and evidence-based review.

## Project Structure

### Documentation (this feature)

```text
specs/001-facility-issue-tracker/
├── plan.md              # This file
├── research.md          # Research decisions and resolved unknowns
├── data-model.md        # Domain entities and invariants
├── quickstart.md        # Validation and demo run guide
├── contracts/           # Authentication and issue API contracts
└── tasks.md             # Planned for a later /speckit-tasks execution
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── app.ts
│   ├── db.ts
│   ├── server.ts
│   ├── types.ts
│   ├── auth/
│   ├── domain/
│   ├── repositories/
│   ├── services/
│   └── seed/
└── tests/
    ├── integration/
    └── e2e/

frontend/
├── app.js
├── index.html
├── styles.css
└── src/
    ├── components/
    ├── pages/
    └── services/
```

**Structure Decision**: The implementation will reconcile the existing layered web architecture rather than create a parallel application: Express backend API, lightweight browser frontend under `frontend/`, sql.js-backed deterministic seed data, and integration/E2E test coverage under `backend/tests/`. Existing pages, components, services, and shared stylesheet remain the frontend ownership boundaries for the employee and administrator workspace changes. Authentication exposes a replaceable local demo credential boundary for future corporate SSO/Entra ID integration; backend role authorization remains independent of the credential provider.

## Design and Validation Phases

### Phase 0: Research

- Confirm the existing frontend architecture and browser capabilities are sufficient for role-specific composition, accessible controls, responsive layout, and gentle motion without adding a UI framework.
- Confirm API contracts remain authoritative for employee read-only behavior and administrator mutations.
- Record visual and interaction decisions in `research.md` and `contracts/ux.md`.

### Phase 1: Design

- Define the shared visual tokens, responsive layout constraints, focus/keyboard behavior, and reduced-motion behavior.
- Define employee and administrator workspace contracts, including visible actions and progressive disclosure boundaries.
- Extend `quickstart.md` with repeatable acceptance checks for both workspaces.

### Phase 2: Implementation Handoff

- Implement only in existing frontend files and components after this plan is accepted.
- Keep all API calls, role checks, lifecycle validation, persistence, seed counts, and authorization behavior aligned with the existing contracts.
- Run backend tests/build and the UX validation scenarios before completion.

## Complexity Tracking

No constitution violations are present; no complexity exceptions are required for this feature.
