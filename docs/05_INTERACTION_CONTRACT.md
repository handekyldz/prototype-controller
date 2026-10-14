# Interaction Contract — Deterministic Scenario Engine

## Principle

Controller prepares a condition; **the prototype user's actual click** causes recovery. Replacing the screen with an image is not an acceptable simulation.

## Minimal versioned scenario JSON shape (conceptual)

```json
{
  "schemaVersion": "0.1",
  "id": "upload.partial-failure",
  "title": "One of three files fails",
  "scope": "flow",
  "flowIds": ["upload-documents"],
  "targets": ["upload.panel", "upload.file-list"],
  "initial": {"upload.panel": "idle", "upload.file-list": "empty"},
  "steps": [
    {"on": "SELECT_FILES", "from": "idle", "to": "uploading", "effects": [{"kind": "mock-upload", "outcome": "2-success-1-failure"}]},
    {"on": "UPLOAD_SETTLED", "from": "uploading", "to": "partial-error"},
    {"on": "RETRY_FAILED_FILE", "from": "partial-error", "to": "retrying", "effects": [{"kind": "mock-retry", "files": "failed-only"}]},
    {"on": "RETRY_SETTLED", "from": "retrying", "to": "success"}
  ],
  "reset": "baseline"
}
```

Example describes desired semantics, **not a finalized implementation schema**. During M3, define strict schemas (IDs, events, guards, effects, target states, and version migration behavior); do not execute arbitrary strings or code from manifests. File-level statuses need typed payloads so two successful files remain successful.

## Execution state

`activeScenarioId`, `phase`, `targetOverrides`, `resourceSnapshots`, `eventLog`, `manualOverride` and `baseline`. Prefer pure reducer + explicit effect adapters; avoid scattered implicit React state.

## Rules

- All events are semantic (`SELECT_FILES`, `RETRY_FAILED_FILE`) and typed, not raw DOM selectors.
- A step runs only if active scenario, preconditions, and current phase match.
- Mock effects are deterministic; no real upload, payment, mutation, or production request.
- Retry reads failed-file IDs from current simulated file statuses. Successful results persist.
- Slow/loading state is controllable (explicit next event), not dependent on flaky timing.
- On scenario change or reset, cancel pending simulated effects and ignore stale event completions (generation ID).
- Validate every target, state binding, and effect before scenario activation. If invalid, surface a precise error without partial application.
- At MVP, single active scenario; manual component override is allowed only when conflict rule permits it. Same-target conflict -> visible error.
- Record event log for debugging/presentation; avoid logging sensitive data.

## API sketch (not fixed public API)

```ts
controller.activate('upload.partial-failure');
controller.dispatch({ type: 'SELECT_FILES', fileIds: ['a', 'b', 'c'] });
controller.dispatch({ type: 'RETRY_FAILED_FILE' }); // invoked by real Retry CTA
controller.reset('baseline');
```

## Core acceptance behavior

Given 3 files and mock result `a=success,b=success,c=error`, show the correct partial-error UI; on real CTA Retry, only `c` enters retrying, then succeeds; `a` and `b` remain complete; reset returns to baseline; controller disabled preserves original upload flow.
