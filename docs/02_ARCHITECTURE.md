# Architecture — v0.1

## Delivery model

**Claude Code plugin** orchestrates file inspection, decision questions, state generation/mapping, and integration; **TypeScript runtime** simulates contracted behavior; **React package** exposes provider/hooks/panel. No MCP or background service in MVP.

```text
Claude Code plugin (skills: discover / analyze / integrate)
     | reads project, writes reviewed manifest & adapter edits
     v
Project-owned .prototype-controller/ (flows, bindings, scenarios, decisions)
     | validates against schemas
     v
Runtime core (events, target resolution, deterministic transitions)
     | adapter interface
     v
React bindings (provider/hooks) + dev-only floating controller
     |                         |
     +---- simulated data ----+---- existing UI / generated states
```

## Intended packages

- `packages/schema`: Zod (or equivalent) schemas + exported inferred TS types; versioned document format.
- `packages/runtime`: framework-independent state machine, scenario orchestration, override resolution, event log and reset.
- `packages/react`: provider, resource/target adapter, floating Explore/Present controller; tree-shakeable and gated to development.
- `skills/`: Markdown workflows; loaded on demand in the distributed plugin.
- `examples/upload-prototype`: acceptance fixture and demo; must work with controller disabled.

## Hierarchy is a graph, not only a tree

- `Flow` links one or more page IDs and target IDs; may traverse routes.
- `Page` represents a route/screen; contains target references.
- `Target` is a stable semantic address, e.g. `upload.panel`, `upload.file-list`, `dashboard.revenue`.
- `Scenario` references one or more targets across a chosen `scope`: component, page, flow, cross-flow (last is schema-ready but not feature-complete).
- Target IDs are stable registry keys, not CSS selectors or implicit component names.

## Runtime resolution rules (MVP)

1. Exactly **one active scenario** at a time, optionally with a single explicitly selected manual target override. No parallel scenarios.
2. A manual override of a child target may supersede a parent/page target effect **only on that child**. Never leak to siblings.
3. Two competing overrides for the exact target cannot be silently merged; reject with a visible conflict. No last-write-wins.
4. Resolve target effects atomically; on scenario activation, validate all referenced targets/states before making changes.
5. Event transitions require a matching declared event and preconditions; invalid events do not change state.
6. Reset clears mocks, transient events, in-flight simulated timers/promises, and override state; the UI returns to its recorded baseline.

## Adapter boundaries

- Resource adapter: mock result/delay/failure instead of unsafe real API calls.
- UI adapter: map `targetId + stateId` to existing or generated visual component.
- Action adapter: prototype's real button dispatches semantic events such as `RETRY_FAILED_FILE`.
- No runtime evaluation of arbitrary component paths from JSON; bind via build-time typed registry.

## Safety / project hygiene

Development-only activation, mocks over production requests, no silent changes to designer components, separate Git diff for integration, no hard-coded tokens or user secrets, no generated build artifacts in Git, and explicit uninstall steps. CLI should inspect project before edit and summarize touched files.

## Package/plugin implementation note

Use a root `.claude-plugin/plugin.json`; place skills at `skills/discover/SKILL.md`, `skills/analyze/SKILL.md`, `skills/integrate/SKILL.md`. After files exist, validate with `claude plugin validate .` and load locally with `claude --plugin-dir .`. Plugin packaging is **not** the same as installing the React runtime into a target app.
