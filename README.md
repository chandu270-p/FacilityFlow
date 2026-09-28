# FacilityFlow

FacilityFlow is an Office Facility Issue Tracker that gives employees a simple way to report and follow workplace facility issues while giving Facility Administrators a controlled workspace to categorize, prioritize, assign, resolve, and close those issues.

The project was developed using a **Spec-Driven Development** workflow with GitHub Spec-Kit and GitHub Copilot, with requirements, design decisions, contracts, validation criteria, and implementation tasks maintained alongside the application.

## Problem

Workplace facility issues can become difficult to track when requests are handled through disconnected conversations or informal channels. FacilityFlow provides a shared issue desk with clear ownership, status visibility, role-based access, and a controlled issue lifecycle.

## Solution

FacilityFlow provides two dedicated workspaces.

### Employee Workspace

Employees can:

- Authenticate using a provisioned employee account.
- View the shared issue list and issue details.
- Create a new facility issue.
- Select the initial category and priority.
- Follow the current issue status.

After submission, employee issue details are read-only. Employees cannot assign, resolve, close, or otherwise modify restricted issue fields.

The employee workspace provides a contextual greeting and a conversational **Report an issue** flow.

### Facility Administrator Workspace

Facility Administrators can:

- View the complete operational issue queue.
- Search and filter issues.
- Categorize and prioritize issues.
- Assign issues to Facility Administrators or leave them unassigned.
- Manage the issue lifecycle.
- Record resolution information.
- Resolve and close issues according to the defined lifecycle rules.

The administrator workspace uses progressive disclosure so operational controls remain focused on the task being performed.

## Issue Lifecycle

The supported lifecycle is:

```text
Open → In Progress → Resolved → Closed