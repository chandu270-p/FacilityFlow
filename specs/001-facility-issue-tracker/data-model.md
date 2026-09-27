# Data Model: Facility Issue Tracker

## Overview

The data model is intentionally constrained to a single facility operations domain. It supports issue reporting, admin operational management, and deterministic demo seeding while preserving strict role boundaries and lifecycle integrity.

## Core Entities

### Employee

Represents a pre-provisioned employee user.

- `employee_id`: unique, string identifier
- `name`: display name
- `email`: complete company-email boundary address configured by `FACILITYFLOW_EMPLOYEE_EMAIL_DOMAIN` (default demo placeholder: `company.example`)
- `department`: string, such as Facilities, IT, Operations, HR, or similar demo department
- `floor`: integer from 1 to 8
- `role`: `Employee`
- `status`: active user status value

Validation rules:
- Exactly 100 Employee-role accounts exist in the default demo seed.
- Each employee belongs to exactly one floor.
- Employees are distributed across exactly 8 floors without a fixed per-floor count.
- Every employee has a unique `employee_id`, one complete company-email boundary address, and persisted authentication/account information required for demo login. The internal `employee_id` is not an employee-facing login identifier.

### Facility Administrator

Represents a privileged facility operations user.

- `employee_id`: unique identifier
- `name`: display name
- `email`: fictional `facilityflow.demo` address
- `department`: operational department or admin support area
- `floor`: optional facility assignment or admin home floor
- `role`: `Facility Administrator`
- `status`: active user status value

Validation rules:
- Exactly 4 facility administrators exist, for 104 total pre-provisioned accounts with the 100 Employee-role accounts.
- Facility administrators are the only valid issue assignees.
- Employees are never valid issue assignees.

### Facility Issue

Represents a workplace facility problem requiring triage and resolution.

- `id`: unique issue identifier
- `reporter_id`: exactly one Employee reference
- `assignee_id`: optional Facility Administrator reference or null
- `category`: one of the valid categories
- `priority`: one of the valid priorities
- `status`: one of the valid statuses
- `description`: issue summary
- `created_at`: creation timestamp
- `updated_at`: most recent modification timestamp
- `resolved_at`: optional timestamp when resolution is recorded
- `closed_at`: optional timestamp when issue is closed
- `resolution_notes`: optional resolution details

Validation rules:
- Exactly 40 seeded issues exist in the default demo dataset.
- There is no fixed issue quota per employee or floor.
- Employees may create additional issues after login, and new issues persist in the application database.
- Every issue has exactly one reporter and must be linked to an employee.
- Assignee is null or a Facility Administrator; never an employee.
- Resolution details are required for Resolved or Closed issues.

### Issue Category

Fixed controlled vocabulary.

Valid values:
- Electrical
- HVAC
- Plumbing
- IT / Network
- Furniture
- Cleaning
- Security
- General Facilities

### Issue Priority

Fixed controlled vocabulary.

Valid values:
- Low
- Medium
- High
- Critical

### Issue Status

Fixed controlled vocabulary.

Valid values:
- Open
- In Progress
- Resolved
- Closed

Lifecycle contract:
- Open → In Progress → Resolved → Closed
- Invalid transitions are rejected and preserve the last valid state.

## Relationships

- One `Employee` may report multiple `Facility Issue` records.
- One `Facility Issue` has exactly one `Employee` reporter.
- One `Facility Issue` may have an optional `Facility Administrator` assignee.
- `Facility Administrator` records can appear as issue assignees but are not reporters in the seeded issue set unless explicitly allowed by demonstration logic.

## Data Integrity Invariants

- 100 Employee-role accounts + 4 administrators = 104 pre-provisioned accounts total.
- 8 floors with flexible employee distribution.
- 40 seeded issues total; additional employee-created issues are allowed.
- Every issue has exactly one employee reporter.
- Every assignee is null or one of the 4 Facility Administrators.
- All issue category, priority, and status values are limited to the controlled vocabularies in the specification.
- A Closed issue cannot be created without prior resolution and a valid resolution record.

## State Transitions

```text
Open -> In Progress -> Resolved -> Closed
```

The system must reject the following invalid paths:
- Open -> Closed
- Resolved -> Open
- Any transition that bypasses required resolution information
- Any mutation that changes issue category or priority for an employee after creation
