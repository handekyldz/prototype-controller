# Test Strategy & Acceptance Gates

Tests follow product behavior, not just coverage percentages. Use fast unit tests first, one cross-component integration test, then a short manual demo.

## Required automated checks

| Area | Cases |
|---|---|
| Discovery | Finds upload flow; distinguishes observed/inferred; references real file/symbol; doesn't mutate source |
| Schema | Invalid target, unknown state, duplicate ID, wrong schema version rejected with useful errors |
| Mapping | `existing` remains visually locked; generated ready/pending unmapped behavior; missing component key reported |
| Reducer | Invalid event ignored; valid event transitions; reset to baseline; deterministic mock outcome |
| Scope | Child override scoped; same-target collision rejected; siblings unchanged |
| Async | Old completion after reset/new scenario ignored; no requests leak to real write API |
| Retry | Only failed file retried; completed uploads retained; retry failure can remain error |
| Disabled mode | Original application works without provider/panel and without simulations |
| Plugin | `claude plugin validate .` passes after manifest exists; intended skill names appear on local load |

## Manual acceptance walkthrough

1. Open upload fixture with controller **disabled**. Verify baseline works.
2. Enable development controller, run discovery; note confirmed vs inferred cases.
3. Bind existing designer error state and verify same visual copy/styles/layout.
4. Generate loading state; verify it can be mounted and reviewed.
5. Pick `partial upload failure`; select 3 files.
6. Observe 2 success + 1 failure, correct CTA and status copy.
7. Click **Retry** inside prototype, not the controller; verify only 1 file retried.
8. Trigger reset and inspect baseline; open Present and navigate scenario steps.
9. Build for production; confirm panel/mock injection is absent or inert.
10. Remove integration; original app still runs.

## Reporting format

Record command, result (pass/fail/not-run), and blocker. Never claim a test passed if it was not executed. Avoid lengthy console logs; include only the decisive failure line or path.
