---
name: discover
description: Read-only discovery of one user flow in a React prototype. Produces an evidence-backed inventory of targets, observed states, inferred edge cases, open UX questions and missing implementation. Use when the designer asks what states or edge cases a prototype flow has, or before mapping states for the prototype controller.
---

# Discover a prototype flow

Turn an unfamiliar prototype into a reviewable, evidence-backed inventory for **one flow**. Discovery is read-only.

## Hard rules

- Do **not** edit, create, format or delete application files. Do not install packages. Do not generate UI.
- Never invent file paths, line numbers, symbols, API behavior or permissions. Every evidence pointer must be something you actually read.
- Keep `observed`, `inferred` and `confirmed` separate:
  - `observed`: code or project docs directly show it. Needs at least one evidence pointer.
  - `inferred`: plausible from task/data dependencies but not implemented. Needs a one-line rationale. May cite the code that makes it plausible.
  - `confirmed`: only after the designer explicitly accepts it in this conversation.
- Confidence (`high` / `medium` / `low`) is how sure you are of your interpretation, not how likely the case is.
- Distinguish **missing implementation** (searched, not found) from **unknown product decision** (a question).

## Read order (stop as soon as the flow is clear)

1. Top level only: `package.json`, framework config, `README`, `CLAUDE.md`, route/page and component directory names. No recursive dumps.
2. Entry point and routes, to pick the user-facing flow. If several flows exist and the designer did not name one, list them and ask which to discover.
3. Only the components, hooks, stores, mocks and API files involved in that flow.
4. Grep the flow's files for state guards and handlers: `loading`, `isUploading`, `error`, `catch`, `empty`, `length === 0`, `retry`, `disabled`, `onClick`, `onChange`, `abort`.
5. Tests or design references only if they resolve an uncertainty.

## What to look for

Apply only the dimensions relevant to the flow:

| Dimension | Examples |
|---|---|
| data | no data, partial/inconsistent data, duplicates, size or count limits |
| network | slow, timeout, offline, transient vs final failure |
| user-action | double submit, rapid repeats, cancel, navigating away mid-task |
| auth | expired session, read-only, denied action |
| concurrency | stale responses, overlapping edits, races |
| presentation | long names, many items, narrow screens |
| recovery | retry failed subset, undo, keep successful results |

Name targets as stable semantic ids (`upload.panel`, `upload.file-list`), never CSS selectors or component names.

## Output: review summary first

Reply with a compact Markdown summary, then stop and let the designer review:

```text
Flow: upload-documents — <one line>
Targets: upload.panel, upload.file-list
Observed:
  - <state> — <file>:<line> `<symbol>`
Inferred:
  - <edge case> [dimension, confidence] — <rationale>
Not found: <what you searched for and where>
Questions (max 3, highest impact first):
  1. <question> — recommended: <default>; consequence: <what changes>
```

Interview policy: at most **3** questions per round, grouped, each with a recommended default and its consequence. Prioritize layout, data preservation and recovery decisions. Do not ask about routine states whose behavior is obvious; offer them as a checklist to accept or edit. Never re-ask a question the designer already answered.

## Persisting (only after the designer approves the summary)

Write `.prototype-controller/discovery.json` in the prototype project. Paths are relative to the project root; `symbol` is exact text that appears on that line. This is the only file discovery may write.

```json
{
  "schemaVersion": 1,
  "project": { "name": "<package name>", "framework": "react-vite" },
  "flows": [
    {
      "id": "upload-documents",
      "summary": "...",
      "status": "observed",
      "confidence": "high",
      "evidence": [{ "file": "src/App.tsx", "line": 7, "symbol": "<UploadPanel />" }],
      "targets": [
        { "id": "upload.panel", "summary": "...", "status": "observed", "confidence": "high", "evidence": [ ... ] }
      ],
      "states": [
        { "id": "uploading", "targetId": "upload.panel", "summary": "...", "status": "observed", "confidence": "high", "evidence": [ ... ] }
      ],
      "edgeCases": [
        {
          "id": "partial-failure",
          "dimension": "recovery",
          "targetIds": ["upload.file-list"],
          "summary": "...",
          "status": "inferred",
          "confidence": "medium",
          "rationale": "...",
          "evidence": []
        }
      ],
      "questions": [
        { "id": "keep-successful-files", "question": "...", "recommendedDefault": "...", "consequence": "...", "relatedIds": ["partial-failure"] }
      ],
      "notFound": [
        { "id": "no-error-handling", "summary": "...", "searched": ["src/upload/useUpload.ts"] }
      ]
    }
  ]
}
```

Rules the file must satisfy: ids are lowercase segments joined by `.` or `-` and unique within a flow; every `targetId` / `targetIds` entry names a declared target; every `relatedIds` entry names an id in the same flow; when the designer answers a question, add `"answer"` and set the related finding to `confirmed` if they accepted it.

After writing, summarize the file path and what changed. Do not continue into state mapping or integration.
