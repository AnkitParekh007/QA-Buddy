# QA Personal Agent — implementation starter (v0.1)

Independent local-first Windows QA assistant, **not** a deployed product or production-ready autonomous agent.

## Implemented in this starter

- Electron desktop + Angular chat application with strict isolated preload IPC.
- Anthropic Messages API integration for QA planning and test-case generation.
- Read Jira Cloud stories through REST v3 (API token stored encrypted).
- Save last 200 conversation messages locally in JSON.
- Maintain multiple named HTTPS environment profiles, with an explicit production flag.
- Playwright Chromium launch, homepage smoke check and screenshot artifact.
- Electron `safeStorage` encrypted secret storage. If OS encryption is unavailable, secrets are refused.
- Windows NSIS packaging configuration and initial static policy tests.

## Prerequisites

- Windows 10/11, Node.js 22 LTS or newer, npm.
- Anthropic API key, Jira Cloud base URL, Jira email and API token.
- Network access to npm, Anthropic and Jira.

## Get started

```powershell
npm install
npx playwright install chromium
npm test
npm start
```

In **Connections & environments** configure the model ID, Jira URL/email, then save the Anthropic API key and Jira token. The model ID must be one available to your account. Select **Conversation** and try `Read PCC-1842 and generate positive, negative and boundary tests`.

To package for Windows:

```powershell
npm run package:win
```

Electron is a native UI: run the application on a local desktop with graphics support. This code has **not** yet been dependency-installed or browser-executed in the generating environment because npm registry access was unavailable.

## Architecture / security notes

- Secrets in `vault.json` are encrypted using Electron `safeStorage`; settings and conversations are **not encrypted in v0.1**. Do not store confidential customer data until at-rest encryption, data retention and privacy controls are added.
- Never use production credentials for automation while this foundation is being tested.
- Homepage smoke checks do **not** authenticate, perform assertions beyond page load, or do regression.
- Do not treat generated test cases as executed test results.
- The Jira API is **read-only** here; attachment upload, Jira bug creation and approvals are future work.
- A hardened version must add redirect/DNS/private-network policy enforcement, stronger resource-level browser permissions, encrypted trace/artifact storage, test sandboxing, user approval gates, and code signing.
- No unrestricted shell tools, arbitrary MCPs, direct Jira mutations or automatic production writes are exposed.

## Implementation sequence

1. Replace the demo one-shot chat routing with a constrained tool-call planner plus reviewable action plan.
2. Add deterministic test-case schema, acceptance-criteria traceability, Excel exporter and human-approved Jira attachments.
3. Add browser credential injection, manual takeover, structured step assertions and screenshot redaction.
4. Add Jira bug draft + explicit approval, safe upload of artifacts and issue linking.
5. Add versioned Playwright suites, pre/post release comparison, report lifecycle and audit events.
6. Replace JSON history with encrypted SQLite, add Windows code signing, signed updates and integration tests.

See `docs/roadmap.md` for day-by-day milestones.
