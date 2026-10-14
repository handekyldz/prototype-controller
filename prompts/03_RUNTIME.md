# Prompt 03 — M3 Interaction Runtime

Read `CLAUDE.md`, `docs/09_WORKLOG.md`, `docs/05_INTERACTION_CONTRACT.md`, and the architecture's runtime resolution section. Read only related source files.

Build **M3 only**:

- Versioned, validated typed scenario schema; pure state machine/reducer and event dispatch.
- One-active-scenario and scoped override conflict rules.
- Deterministic local mock upload outcomes and stale completion/reset safeguards.
- `upload.partial-failure`: 3 files, 2 successes, 1 failure; the **real prototype Retry CTA** dispatches event to retry failed file only.
- Tests for invalid events, conflict, retry-isolation, cancellation/reset and disabled mode.

No broad network interception, production API calls, controller UI or Next.js. Plan <=5 bullets first; run focused tests; update worklog and STOP.
