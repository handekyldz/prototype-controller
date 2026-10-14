# Prototype Controller — Instructions for Claude Code

We are building an open-source Claude Code plugin + an opt-in React prototype runtime. This repo starts with Markdown specs; application/plugin code may not exist yet.

## Priorities

1. Ship the current milestone only; see `docs/06_IMPLEMENTATION_PLAN.md` and `docs/09_WORKLOG.md`.
2. Follow locked decisions in `docs/08_DECISIONS.md`. Do not re-ask answered product questions.
3. Preserve designer-owned UI; never rewrite existing visual components without explicit approval.
4. Distinguish observed behavior, inferred behavior and designer-confirmed decisions.
5. Prefer simple, typed, deterministic implementations over abstraction and speculative features.

## Token / scope discipline

- Read this file and the current milestone's referenced docs only. Do not preload every `docs/` or `prompts/` file.
- Search for relevant filenames/symbols first, then read narrow sections. Do not recursively dump the repo.
- Before editing: state a plan of <=5 bullets, changed files, and acceptance criteria.
- Implement one bounded slice; stop at the milestone gate. No opportunistic refactors.
- Keep responses compact: changed files, tests run, failures, next step. Avoid repeating specs.
- Do not spawn subagents, add MCP servers, run mass-formatters, or install dependencies unless demonstrably needed.
- Ask only questions that block a design decision; otherwise document assumptions.
- Update `docs/09_WORKLOG.md` at the end of each milestone with short factual notes.

## Constraints

- Initial stack: TypeScript, React + Vite sample, minimal shared runtime, schema validation, focused tests.
- Plugin's eventual root contains `.claude-plugin/plugin.json` and `skills/<name>/SKILL.md`.
- No backend integration or direct Figma sync in v0.1. Screenshots/text can be design references.
- No unapproved destructive actions, hidden production changes, or real write API calls from simulations.
- No claim that automated edge-case discovery is complete.

## Definition of done

A task is done only when its stated tests run (or blockers are documented), acceptance checks pass, and the worklog is updated. Do not advance milestones automatically.
