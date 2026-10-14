# Product Specification — v0.1

## Problem

AI-created prototypes tend to demonstrate a happy path but omit meaningful loading, empty, partial failure, permissions, concurrency, retry and recovery behavior. Designers need to discover and **interactively show** those behaviors, not just generate static screens.

## Users and job to be done

Primary: product designers building interactive prototypes with Claude Code. Given an existing React prototype, help me discover relevant edge cases, decide unresolved UX behavior, and demonstrate each scenario without destroying my designs.

## Core user journey

1. Designer invokes discovery from Claude Code in an existing prototype.
2. System identifies flows, pages, components, actions, data dependencies and existing states. It cites code locations as evidence.
3. System proposes standard and context-specific scenarios, indicating confidence and whether a decision is needed.
4. Designer confirms/rejects scenarios and chooses state UI source **per state**: `generate`, `use existing`, or `provide later`.
5. For provided designs, designer can use **existing components** OR **screenshots, Figma screenshots, or written descriptions**; controller maps them to state targets. Direct Figma API sync is not part of v0.1.
6. Plugin integrates selected states and interaction contracts, showing the diff for designer-owned UI.
7. Floating development controller runs scenarios; real prototype interactions such as Retry determine state transitions.
8. Designer can reset to baseline and present a short scenario sequence.

## Mandatory MVP capabilities

- Analyze one React + Vite + TypeScript project and identify at least one flow with component and page targets.
- Detect existing normal/loading/empty/error cases where code evidence exists; propose missing states only when relevant.
- Detect context-specific edge cases (e.g. partial file upload failure) with evidence/rationale; never pretend exhaustive coverage.
- Ask concise decision questions only for behavioral ambiguity; remember confirmed decisions in project-owned data.
- Bind existing designer component without changing its appearance; generate a missing state consistent with current styles.
- Support screenshot/text references as a creation input, requiring human review of visual fidelity.
- Run a deterministic partial upload failure and real-click Retry that affects only failed files.
- Show basic Explore navigation (flow → scenario; scope filter) and minimal Present sequence.
- Support scoped reset, local-only mock behavior and protection against accidental production enablement.

## Standard state taxonomy (conditional, not global)

`idle`, `loading`, `success`, `empty`, `no-results`, `partial-error`, `full-error`, `offline`, `permission-denied`, `retrying`. These are vocabulary, **not** a requirement to render all states on every component.

## Design ownership rules

- `generate`: Claude creates missing visual state from project conventions.
- `use existing`: preserve the provided component's visual DOM/style; connect behavior via explicit adapter.
- `provide later`: maintain pending mapping; do not silently substitute a generated design.
- Designer can choose differently per target + state.
- Never overwrite existing visual assets merely to make the demo work; propose smallest binding change.

## MVP exclusions

Next.js/framework adapters, comprehensive automatic network interception, Figma MCP/API sync, collaborative sessions, AI continuous monitoring, visual regression infrastructure, live production API error injection, generic test-case generation for all repos, multi-scenario concurrent execution.

## Product success checks

A designer can inspect 1 upload flow, understand observed vs proposed cases, supply an error state, generate a loading state, trigger partial failure, click Retry in the prototype, see only the failed file retry, reset, and present the flow. Installation and removal must not break the normal prototype.
