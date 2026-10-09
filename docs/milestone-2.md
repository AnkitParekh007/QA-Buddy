# Milestone 2 — QA vertical slice

Added:
- Generate Jira-story-specific test cases using the configured Anthropic model.
- Persist a generated Markdown artifact for each story locally.
- Explicit confirmation before attaching the generated artifact to Jira.
- Preview and explicitly approve Jira Bug creation with reproducible steps and expected/actual fields.
- Jira mutations execute in the Electron main process; access token stays outside model context.

Limitations:
- Browser smoke only captures the environment homepage and does not authenticate or execute generated cases.
- Jira bug issue type must be named Bug and available in the target project; custom required fields may need mapping.
- Jira attachment uses Markdown for fast delivery, not XLSX yet.
- Bug creation does not yet attach evidence or link the bug to the source story.
- Do not use production mutation until further policy and credential controls are implemented.
- External Jira/model and desktop builds require verification with test credentials.

Operator flow:
1. Configure Jira URL, Jira email, API token and Anthropic API key.
2. Enter story key under QA workflow and select Generate cases.
3. Review locally generated Markdown. Click Review & attach cases to Jira to approve remote attachment.
4. To file a bug, fill in summary, steps, expected, actual and environment. Review the confirmation dialog before Jira creation.

Next: authenticated browser flows, executable assertions, evidence attachment and issue linking.
