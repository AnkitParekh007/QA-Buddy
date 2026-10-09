# Delivery roadmap

## Current: Milestone 0 — source foundation
Angular/Electron scaffold, isolated IPC, Jira read, Anthropic prompts, Playwright homepage smoke, OS-backed encrypted secrets, JSON conversation persistence and basic UI are implemented in source. They remain unverified against downloaded dependencies and real endpoints.

## Days 1–3 — executable demo
- Install dependencies on Windows; pin exact versions and commit lockfile.
- Confirm Angular build, Electron startup, Playwright browser installation and UI smoke test.
- Wire Jira read with representative project and confirm Cloud/Server variant.
- Confirm approved model ID, data governance and provider access.
- Replace generic advice with structured test-case output including acceptance criteria coverage.
- Add proper unit tests, IPC validation and end-to-end smoke tests.

## Days 4–6 — QA interactions
- Test case editing, xlsx export, reviewed Jira attachment write.
- Credentials with OS vault, environment-bound credential references and SSO takeover.
- Multi-page browser actions with deterministic assertions and evidence.

## Days 7–10 — issues and evidence
- Jira bug drafts, required field mapping, permission confirmations, screenshots/traces and issue linking.
- Strict browser destination enforcement, prompts as untrusted content and redaction.

## Days 11–13 — regression / release
- Reusable versioned Playwright suites, fixtures and pre-/post-release comparison.
- Stable report format and test-run replay.

## Days 14–15 — supervised pilot
- Windows installer; QA acceptance runs in DEV/Playground; audit review and bug fixing.
- Do not enable unapproved PROD mutations.

## Team and scope
Two TypeScript engineers + part-time QA lead; one Jira Cloud project and two non-production environments first. More advanced organizational functionality is explicitly out of scope for the pilot.
