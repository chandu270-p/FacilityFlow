# FacilityFlow UX Contract

## Scope

This contract defines the planned frontend experience for the approved Employee and Facility Administrator roles. It constrains presentation and interaction only; authentication, authorization, persistence, seed data, issue domains, and lifecycle rules remain defined by `spec.md` and `issue-api.md`.

## Shared Product Identity

- Both workspaces use the FacilityFlow brand and a shared visual system.
- The foundation is warm off-white/ivory with soft charcoal typography, restrained warm accents, generous whitespace, minimal borders, subtle shadows, and gentle purposeful motion.
- Visual hierarchy is restrained and operationally useful. The interface must avoid dense KPI clutter, crowded sidebars, excessive gradients, excessive animation, and generic enterprise dashboard composition.
- The layout is responsive at desktop and narrow mobile widths.
- Interactive elements have labels or accessible names, visible keyboard focus, readable status communication, and sufficient contrast.
- Non-essential motion respects the user's reduced-motion preference.

## Employee Workspace

- The workspace is visibly identified as the Employee workspace.
- The opening context includes a friendly greeting using the authenticated employee's name.
- `Report an issue` is the primary action.
- Issue creation is a short, conversational flow with human-language purpose copy and fields for description, initial category, and initial priority.
- The employee can see submitted issues, current status, and issue details through the shared issue experience.
- Employee views do not present assignment, categorization changes, prioritization changes, status changes, resolution, or closure controls after creation.
- These presentation restrictions do not replace or weaken backend authorization.

## Facility Administrator Workspace

- The workspace is visibly identified as the Facility Administrator workspace.
- The opening context communicates what needs attention without overwhelming the user.
- The primary operational surface is an issue queue with useful status and priority signals.
- The queue supports text search and status filtering without changing the authorized dataset.
- Selecting an issue reveals relevant administrator controls through progressive disclosure.
- Permitted administrator operations remain available: category, priority, assignment, status, resolution, and closure, subject to the existing API and lifecycle rules.
- Invalid or unauthorized responses are reported accessibly and do not appear as successful local updates.

## Acceptance Evidence

- A desktop and narrow-mobile check demonstrates both workspace compositions and no horizontal overflow that blocks core actions.
- Keyboard navigation reaches the primary action, form fields, queue controls, issue rows, and detail controls with visible focus.
- Screen-reader or accessibility inspection identifies the workspace heading, form labels, issue status, filtering controls, and error/success feedback.
- Reduced-motion inspection confirms non-essential transitions are suppressed or reduced.
- Backend integration tests remain green; UX work does not change the approved account totals, seed issue total, issue vocabulary, assignee constraints, persistence behavior, or lifecycle.