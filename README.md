# FacilityFlow

FacilityFlow is a local demonstration issue desk for workplace facility operations. Employees report issues into a shared queue; Facility Administrators categorize, assign, resolve, and close them through a guarded lifecycle.

## Run Locally

```text
npm install
npm run seed
npm start
```

Open `http://localhost:3000`.

Use the complete provisioned company email and select the matching role on the login page. Employee demo records use the configurable `FACILITYFLOW_EMPLOYEE_EMAIL_DOMAIN` boundary, defaulting to reserved `company.example`; this represents a future corporate SSO/Entra ID integration and is not a real company authentication check. Administrator demo records remain on `facilityflow.demo`. Credential hashes are supplied by the local environment; administrator credentials are never displayed in the UI or returned by the API. All accounts and data are fictional.

## Verify

```text
npm test
npm run build
```

The test suite covers the 104-account/40-issue seed invariants, deterministic demo data, bearer-token login, employee restrictions, administrator lifecycle actions, assignee validation, and the employee-to-administrator demo flow.

The frontend also provides distinct Employee and Facility Administrator workspaces. Employees get a contextual greeting, a conversational `Report an issue` flow, and read-only issue progress. Administrators get an operational queue with search/filtering and progressively disclosed lifecycle controls. The UX contract and browser/manual acceptance scenarios are documented in `specs/001-facility-issue-tracker/contracts/ux.md` and `specs/001-facility-issue-tracker/quickstart.md`.

The automated UX contract checks run with `npm test`; desktop/mobile viewport, keyboard, contrast, and reduced-motion checks are additionally covered by the quickstart scenarios.

## API Notes

- `POST /api/auth/login` accepts a provisioned email, explicit role selection, and role-specific demo credential.
- Authenticated requests use the returned bearer token.
- `GET /api/issues` and `GET /api/issues/:id` are shared read views.
- `POST /api/issues` is employee-only and derives the reporter from the authenticated identity.
- `PATCH /api/issues/:id` is administrator-only and enforces lifecycle and assignee rules.