# Implementation Plan — 5 Milestones, Hard Stop at Every Gate

## Recommended sequence

**M0 — Planning / repository scaffold (no app code)**
- Read `CLAUDE.md`, this plan and locked decisions. Confirm scope + file plan.
- Establish package manager only once (suggest pnpm; do not insist if environment unavailable).
- Prepare Git and minimal tooling. Wait for explicit approval to enter M1.

**M1 — Discovery skill & fixture** → [prompt](../prompts/01_DISCOVERY.md)
- Build a minimal multi-file upload React/Vite fixture with a happy path.
- Implement plugin manifest and `discover` skill, plus typed discovery output model.
- Discover one flow, its targets, observed states and candidate edge cases with evidence.
- Gate: skill reports observed vs inferred correctly; no UI source modified during discovery; plugin validation passes.

**M2 — State mapping & designer ownership** → [prompt](../prompts/02_STATE_MAPPING.md)
- Registry and validation for target-to-state bindings, preserving ownership and origin.
- Existing designer-provided error component wired via minimal adapter.
- Generated loading state; screenshot/text reference path can produce a reviewable proposed component (manual reference input).
- Gate: existing component visually unchanged; generated and pending states differentiated; binding tests pass.

**M3 — Runtime interaction engine** → [prompt](../prompts/03_RUNTIME.md)
- Pure scenario reducer; typed events; validated activation; mocks; reset; conflict rules.
- Multi-file partial failure + real Retry CTA + stale completion guard.
- Gate: deterministic unit tests and integration test with exactly the failed file retried; disabled controller has no effect.

**M4 — React controller UI** → [prompt](../prompts/04_CONTROLLER_UI.md)
- Development-only floating panel; Explore: flow/scenario list, scope, ready/pending statuses.
- Scenario activation and reset; minimal Present sequence (next/previous).
- Gate: designer can demo partial error + recovery without CLI; keyboard and accessible labels work.

**M5 — Packaging & reliability** → [prompt](../prompts/05_PACKAGING.md)
- Complete `analyze` and `integrate` skills; readable README/install/remove documentation.
- Plugin validation, build/typecheck/test, smoke test on clean React/Vite project.
- Gate: local plugin load works, command names correct, no mutation of production config, uninstall recovers baseline.

## Never silently enlarge MVP

Out of scope until v0.2+: Next.js, Figma API integration, network interception by default, simultaneous scenarios, multi-user collaboration, cross-flow orchestration, visual-regression service, marketplace publishing.

## Per-milestone completion note

Update `docs/09_WORKLOG.md` with milestone status, changed files, verified commands and results, known issues, next milestone. Stop. Do not auto-start the next milestone.
