# Prototype Controller — Claude Code Starter Pack

This repository currently contains **planning documents and execution prompts**, not a working plugin. It is the handoff package for building the open-source Prototype Controller with Claude Code.

## What we're building

A Claude Code plugin plus an opt-in React development runtime that: (1) discovers relevant product edge cases; (2) interviews the designer only when behavior is genuinely ambiguous; (3) generates missing UI states or binds to designer-provided components/references; and (4) simulates multi-step interactions in a floating prototype controller.

**First target:** React + Vite + TypeScript; multi-file upload vertical slice. **Not a production testing or error-monitoring product.**

## Start in Claude Code

1. Extract this folder and open a terminal in its root. Initialize Git if needed (`git init`).
2. Start Claude Code from this directory (`claude`). It will see the short `CLAUDE.md` automatically.
3. Copy the contents of [prompts/00_BOOTSTRAP.md](prompts/00_BOOTSTRAP.md) into the Claude Code conversation. Ask for planning only; approve the scope before implementation.
4. Implement milestones **one at a time**, starting with [prompts/01_DISCOVERY.md](prompts/01_DISCOVERY.md). Open a fresh session for each milestone, using [docs/09_WORKLOG.md](docs/09_WORKLOG.md) for handoff.
5. After the plugin is implemented, validate it with `claude plugin validate .` and test it locally with `claude --plugin-dir .`. **These commands will not succeed until the plugin manifest and skill files have been created.**

## Read only when needed

| When | Read |
|---|---|
| Product behavior / scope | [01_PRODUCT_SPEC](docs/01_PRODUCT_SPEC.md), [08_DECISIONS](docs/08_DECISIONS.md) |
| Architecture & boundaries | [02_ARCHITECTURE](docs/02_ARCHITECTURE.md) |
| Discovery implementation | [03_DISCOVERY_PROTOCOL](docs/03_DISCOVERY_PROTOCOL.md) |
| Existing / generated / reference UI | [04_STATE_MAPPING](docs/04_STATE_MAPPING.md) |
| Runtime state machine | [05_INTERACTION_CONTRACT](docs/05_INTERACTION_CONTRACT.md) |
| Milestones & acceptance gates | [06_IMPLEMENTATION_PLAN](docs/06_IMPLEMENTATION_PLAN.md), [07_TEST_STRATEGY](docs/07_TEST_STRATEGY.md) |
| Session efficiency | [10_TOKEN_STRATEGY](docs/10_TOKEN_STRATEGY.md), [09_WORKLOG](docs/09_WORKLOG.md) |

## Intended end-state repository (Claude creates these files later)

```text
.claude-plugin/plugin.json
skills/discover/SKILL.md
skills/analyze/SKILL.md
skills/integrate/SKILL.md
packages/schema/
packages/runtime/
packages/react/
examples/upload-prototype/
tests/
```

## Design principles

- Designer retains ownership of visual and product decisions.
- Observations, inferences and confirmed decisions are kept distinct.
- Existing designer UI is visually protected; behavior may be wired with review.
- Real user clicks drive recovery flows; scenarios do not merely swap screenshots.
- Runtime is explicit, deterministic, dev-only and disabled in production.
- MVP proves **one complete flow**, not a broad framework checklist.
