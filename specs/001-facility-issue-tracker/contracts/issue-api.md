# Issue API Contract

## Purpose

This contract defines the issue flow expected by the local demonstration application. It is designed to capture the authoritative rules required for demo use, validation, and backend authorization enforcement.

## Authentication and Authorization

- Authentication uses persisted fictional account records and a replaceable local demo credential boundary. Employee-role accounts authenticate with complete company-email addresses; Facility Administrators use separate administrator credentials.
- Login requires an explicit `Employee` or `Facility Administrator` role selection. The backend verifies that selection against the provisioned account role before issuing a session.
- Employee IDs are internal identifiers and are not required in the login UI.
- A future corporate SSO/Entra ID/Active Directory provider may replace the local credential mechanism without changing authorization rules.
- All protected requests require a valid provisioned-user session.
- Employee users may create issues and view shared issue data.
- Employee users may not change category, priority, assignee, status, resolution, or closure state after creation.
- Facility Administrators may review all issues, update operational fields, assign issues, and perform lifecycle actions.
- Backend authorization is authoritative; no client state is trusted.
- Unauthorized write attempts return HTTP 403 and do not modify the issue.

### POST /api/auth/login

Authenticates a provisioned account and establishes a role-bearing session.

**Request body**:
- `email`: complete provisioned account email
- `role`: `Employee` or `Facility Administrator`
- `password`: local demo credential boundary value

**Failures**:
- 401 for invalid credentials or missing role selection
- 403 when the selected role does not match the provisioned account role

The response MUST NOT include passwords or password verification material.

## Endpoints

### GET /api/issues

Returns the shared issue list visible to employees and administrators.

**Success**:
- 200 OK
- returns issue summaries with status, category, priority, reporter, and assignee when available

### GET /api/issues/{id}

Returns an issue detail view for authorized users.

**Success**:
- 200 OK

**Forbidden**:
- 403 if the caller is not authorized to view the issue

### POST /api/issues

Creates a new issue by an employee.

**Request body**:
- `description`: required string
- `category`: valid issue category value
- `priority`: valid issue priority value

**Rules**:
- only employee role may create issues
- category and priority are selected at creation and locked thereafter
- issue is assigned a default status and added to the shared list
- reporter is derived from the authenticated provisioned employee
- newly created issues persist in the database and are not limited by a seed quota

**Success**:
- 201 Created

**Validation failures**:
- 400 Bad Request for missing description or invalid enum values

### PATCH /api/issues/{id}

Used for authorized admin updates.

**Allowed admin mutations**:
- category
- priority
- assignee
- status
- resolution details
- close state

**Forbidden employee mutation**:
- any attempt to alter restricted fields returns 403 and leaves the record unchanged

### POST /api/issues/{id}/resolve

Admin resolves an open or in-progress issue.

**Rules**:
- resolution details are required before the item can be marked Resolved
- issue cannot be closed before resolution is recorded

**Success**:
- 200 OK or 204 No Content depending on implementation style

**Failure**:
- 400 Bad Request when resolution is missing or invalid
- 403 when the caller lacks admin rights

### POST /api/issues/{id}/close

Admin closes a resolved issue.

**Rules**:
- issue must already be resolved
- resolution details must be present

**Failure**:
- 400 when close is attempted before resolution
- 403 when unauthorized

## Validation Invariants

- The default seed contains exactly 104 accounts: 100 Employee-role accounts and 4 Facility Administrators.
- The default seed contains exactly 40 initial issues across exactly 8 floors without fixed per-floor or per-employee issue quotas.
- Each issue belongs to exactly one provisioned employee reporter.
- Each assignee is either null or a Facility Administrator.
- Issue categories, priorities, and statuses are restricted to the exact domain values in the spec.
- Invalid transitions are rejected and preserve valid issue state.
- Resolution data is mandatory for Resolved or Closed issue states.

## Frontend Consumption Rules

- The Employee workspace may call the shared list, detail, and issue-creation endpoints, but it must treat category, priority, assignee, status, resolution, and closure as read-only after creation.
- The Facility Administrator workspace may expose the permitted mutation endpoints in the selected issue context, subject to the backend response and lifecycle validation.
- Search and filtering are presentation concerns over returned issue data; they must not change authorization scope or create a second source of truth.
- Workspace composition, progressive disclosure, and hidden controls are UX behavior only. They must not replace the backend authorization checks or imply new permissions.
- Error responses, including HTTP 403 and invalid-transition failures, must remain visible to the user in an accessible status or feedback region without mutating local state as though the request succeeded.
