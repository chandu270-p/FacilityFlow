# Research: Facility Issue Tracker

## Decision Summary

### Decision 1: Local demo web architecture
The implementation will use a simple web application with a backend API and a frontend interface, designed for local demo execution rather than production deployment. This aligns with the specification’s requirement for a local/demo use case and keeps both the authorization model and seeded data easy to test.

**Rationale**: The domain is narrow and explicit, the app is a demo artifact, and the need for automated evidence is stronger than the need for enterprise-grade deployment complexity.

**Alternatives considered**:
- Single-file or no-backend prototype: rejected because the specification requires authoritative server-side authorization and persisted issue state.
- Full enterprise deployment model: rejected as unnecessary for a local demo, SME demonstration, and testability requirements.

### Decision 2: Deterministic seed data
The seed process will generate the same logical account and issue inventory on repeated runs. The exact default counts are fixed: 104 accounts total, consisting of 100 Employee-role accounts and 4 Facility Administrators, across 8 floors, plus 40 initial issues. Floor distribution and issue counts per employee are intentionally flexible.

**Rationale**: Deterministic data supports reproducible demos and stable automated tests while preserving realistic operational variability. Additional employee-created issues must persist beyond the initial seed.

**Alternatives considered**:
- Randomized demo data: rejected because the specification requires exact account and initial issue totals with reproducible validation.
- Manual static fixtures only: rejected because the app should also support seed reproducibility, database persistence, and automated verification.

### Decision 3: Replaceable authentication boundary
The local demo will authenticate against persisted fictional account records using a company-email boundary for Employee-role accounts and separate administrator credentials for Facility Administrators. The credential mechanism will be isolated from role authorization so it can later be replaced by corporate SSO, Entra ID, or Active Directory.

**Rationale**: The specification requires role selection and backend verification while explicitly excluding real corporate password validation. Separating authentication from authorization avoids redesigning protected operations when an identity provider is connected.

**Alternatives considered**:
- Employee ID login: rejected because employee_id is an internal identifier and must not be required in the login UI.
- Client-only role selection: rejected because the backend must verify the selected role against the provisioned account.

### Decision 4: Role enforcement at the backend boundary
The backend is the sole authority for issue mutation authorization. Frontend conditionals are treated as convenience only and are never trusted.

**Rationale**: The specification explicitly requires HTTP 403 rejection for unauthorized employee attempts and no mutation when a client request is invalid.

**Alternatives considered**:
- Client-side permission gates alone: rejected because they do not meet security, testability, or access-control requirements.
- Mixed client/server checks: rejected because the backend must remain the authoritative enforcement point.

### Decision 5: Lifecycle and domain validation
The issue domain will enforce exact categories, priorities, statuses, and lifecycle sequencing, including rejection of invalid transitions such as Open → Closed and Resolved → Open.

**Rationale**: These domain constraints are explicit in the specification and are necessary for consistent operational behavior and auditing during demo or test usage.

**Alternatives considered**:
- Freeform strings or loosely validated enums: rejected because invariant validation would become unreliable and not match the specified operational model.

### Decision 6: Role-specific workspaces with a shared visual system

The frontend will present a dedicated Employee workspace and a dedicated Facility Administrator workspace using the same FacilityFlow visual language. The employee view will lead with a contextual greeting and a prominent `Report an issue` action, then show the employee's submitted issues and readable status/detail information. The administrator view will lead with a focused operational queue, search/filtering, and attention-oriented status/priority signals. Administrative mutation controls will be progressively disclosed in the selected issue detail context rather than presented as a dense dashboard of every control.

**Rationale**: The approved UX requirements call for distinct responsibilities without creating separate products. Role-specific composition makes the primary action clear, reduces cognitive load, and preserves the practical shared issue workflow. Progressive disclosure improves scanability while leaving all permitted administrator operations available.

**Alternatives considered**:
- One identical dashboard for both roles: rejected because it obscures the employee reporting path and administrator operational responsibilities.
- A KPI-heavy enterprise dashboard: rejected because it conflicts with the calm, human, low-noise product direction.
- A separate frontend application for each role: rejected because it duplicates the product shell and risks inconsistent behavior; composition within the existing frontend is sufficient.

### Decision 7: Accessible responsive visual direction

Use the existing lightweight browser frontend and stylesheet as the design system boundary. Favor warm off-white/ivory surfaces, soft charcoal text, restrained warm accents, generous spacing, minimal borders, subtle shadows, and short purposeful transitions. Layouts must reflow for narrow screens, controls must remain keyboard reachable with visible focus, labels and status information must be programmatically understandable, and motion must be reduced or removed when the user requests reduced motion.

**Rationale**: The project is a local demo with no need for a UI framework, and the existing frontend already provides the appropriate ownership boundary. Explicit accessibility and responsive constraints make the visual direction testable rather than subjective.

**Alternatives considered**:
- Add a component framework: rejected because it adds dependency and migration complexity without solving a requirement that the existing structure cannot address.
- Use dense tables and persistent admin control panels everywhere: rejected because it conflicts with the approved hierarchy and progressive disclosure requirements.

## Resolved Unknowns

- The app is a web application for local/demo use, not a production system.
- The primary technical approach is a small backend + frontend architecture with deterministic database seeding.
- Authorization and lifecycle enforcement are mandatory and happen in the backend.
- The exact issue categories, priorities, statuses, account totals, floor count, and initial issue total are resolved in the feature specification and will be encoded as validation rules.
- The UX requirements are sufficiently specified to plan implementation: the remaining visual choices are implementation details constrained by the approved tone, accessibility, responsiveness, workspace separation, and progressive disclosure requirements.

## Follow-up

No critical open questions remain for the planning phase. The design can proceed to data modeling and contract definition without additional clarification.
