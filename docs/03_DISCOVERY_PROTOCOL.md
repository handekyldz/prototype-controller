# Discovery Protocol — Claude Code Skill Specification

## Goal

Turn an unfamiliar prototype into a **reviewable evidence-backed** inventory of flows, targets, observed states, proposed edge cases and unresolved UX decisions. The skill should not modify application code during discovery.

## Efficient read order

1. List top-level package/framework config, route directory, `README`, `CLAUDE.md`, component directories. Avoid full recursive dumps.
2. Inspect entrypoint and route definitions to identify the user-facing flow.
3. Read only involved components/hooks/store/mock/API files for **one selected flow**.
4. Search for state guards and event handlers (`loading`, `error`, `empty`, `onClick`, retries etc.).
5. Inspect tests/design references only when they resolve uncertainty.

## Evidence and confidence

Each finding includes `{kind, id, summary, evidence: [file:line/symbol], status, confidence}`.

- `observed`: direct code or explicit project documentation supports claim.
- `inferred`: plausible based on task/data dependencies; not encoded as an existing feature.
- `confirmed`: designer explicitly accepts a behavior/decision.
- Confidence describes interpretation certainty, **not** likelihood of occurrence.
- Never invent file paths, line numbers, API behavior, or permissions.

## Discovery dimensions (apply selectively)

1. Data: no data, filtered no-results, partial/inconsistent, duplicates, limits.
2. Network: delayed, timeout, offline, transient/final failure, retry.
3. User actions: double-submit, rapid repeated actions, cancel, navigation mid-task.
4. Auth/permissions: expired session, read-only access, denied action.
5. Concurrency: stale responses, overlapping edits, race conditions.
6. Presentation: long labels/content, many items, responsive constraints.
7. Recovery: retry failed subset, undo, rollback, preserved success.

## Output contract

Write proposed structured artifacts under `.prototype-controller/` **after** designer reviews discovery summary; use runtime-validated schemas when implemented. Until then, produce concise Markdown review output:

```text
Flow: upload-documents
Targets: upload.panel, upload.file-list
Observed: file selection, loading flag, success list [evidence]
Proposed: partial failure (reason: multiple parallel uploads)
Question: if 1 of 3 fails, preserve successful files? [recommended: yes]
Not found: proof of retry logic
```

## Interview policy

- Group related questions; prioritize decisions that affect layout, data preservation, or recovery.
- Ask no more than **3 high-impact questions in one round**; give recommended defaults and consequences.
- Do not ask whether to include routine states whose behavior is clear; allow designer to accept/edit a checklist.
- Distinguish missing implementation from unknown product decision.
- Persist confirmed answers; don't ask again unless code or user explicitly changes the decision.

## Approval boundary

Discovery may read code and suggest edits. It does **not** generate UI, install packages, rewrite components or add runtime adapters until a subsequent integration phase is approved.
