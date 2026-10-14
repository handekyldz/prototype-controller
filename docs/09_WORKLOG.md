# Worklog / Session Handoff

Keep this file short (aim for <80 lines). Update it **at the end** of each milestone. It is the only routine session carry-over document.

## Current status

- Milestone: **M4 — controller UI done; awaiting approval for M5**
- Last completed: M4 (2026-10-14).
- Next: approve M5 plan (`prompts/05_PACKAGING.md`); also full README rewrite (install/usage/how it works) and pre-publish file review.
- Known blockers: none. Tooling: npm workspaces (pnpm not installed), Node 24, Vitest, Zod 4. `claude` CLI not on PATH; used the VS Code extension's bundled binary.

## Confirmed product constraints

See `docs/08_DECISIONS.md` (do not duplicate decision list here).

## Milestone history

| Milestone | Status | Evidence / tests | Notes |
|---|---|---|---|
| M0 | docs ready | Markdown handoff created | No working plugin yet |
| M1 | done | `npm test` 20/20, `npm run typecheck`, `npm run build:example`, `claude plugin validate .` passed (1 expected warning: root CLAUDE.md) | Headless skill run on fixture: flow + partial-failure (inferred) found, real evidence, 3 questions, no source changes |
| M2 | done | `npm test` 36/36, typecheck, example build pass; `git diff` shows existing fixture UI unchanged | Bindings schema + typed registry; existing/generated/reference/pending states; see `examples/upload-prototype/.prototype-controller/mapping-summary.md` |
| M3 | done | `npm test` 59/59 (incl. jsdom integration: real Retry CTA retries only c; disabled mode identical markup), typecheck, build pass | Scenario schema, pure reducer + controller (generation guard, timers cancelled on reset), minimal React hooks; fixture seams in `useUpload.ts` (+2 lines) and `UploadPanel.tsx` (+1 slot line), no visual change when inactive |
| M4 | done | `npm test` 67/67 (panel jsdom tests: explore, blocked reason, scope filter, real Retry, conflict alert, Escape/focus, present next/await/previous), typecheck, build; prod bundle grep: no panel/scenario strings; dev server serves all modules | Not yet checked in a real browser; manual steps in `examples/upload-prototype/DEMO.md` |
| M5 | not started | — | Packaging |

## Last changes / next small action

- 2026-10-14 | M1 | root `package.json`, `tsconfig.base.json`, `.gitignore`, `.claude-plugin/plugin.json`, `skills/discover/SKILL.md`, `packages/schema/` (discovery model + tests), `examples/upload-prototype/` (happy-path fixture, golden `test/discovery.expected.json` + evidence tests) | all checks above pass | tests validate the golden result, not LLM output; headless run had only Read/Grep/Glob allowed, so read-only was also enforced by permissions | present M2 plan, stop before coding

- 2026-10-14 | M2 | `packages/schema/src/binding.ts` (+tests), fixture `src/components/ErrorNotice.*` (stand-in designer component), `src/prototype/{adapters,generated,reference,registry}`, `.prototype-controller/{bindings.json,references/,mapping-summary.md}`, `test/mapping.test.tsx` | all pass | text reference is sample input, no screenshot; adapter copy needs designer review; nothing wired into the app until M3 | present M3 plan, stop before coding
- 2026-10-14 | M3 | `packages/schema/src/scenario.ts`, `packages/runtime/`, `packages/react/src/index.tsx`, fixture `src/prototype/{controller.ts,useControlledUpload.ts,FileListStateSlot.tsx}`, `.prototype-controller/scenarios/upload.partial-failure.json`; discovery result moved to `.prototype-controller/discovery.json` (evidence lines updated after seams) | all pass | provider not mounted in `main.tsx` yet (M4), so scenarios are only exercisable in tests; failed files are hidden from designer FileList and shown in the partial-error notice; bundle gating for production is M4/M5 | present M4 plan, stop before coding
- 2026-10-14 | M4 | runtime `check()` + `bindings` (panel needs status without activating), `packages/schema/src/presentation.ts`, `packages/react/src/panel/*` (subpath `@prototype-controller/react/panel`), fixture `main.tsx` (dynamic dev-only mount), `.env.development`, `src/prototype/devtools.tsx`, scenarios `upload.slow`, `upload.permission-denied`, presentation, `DEMO.md` | all pass | inactive registry components' CSS still ships in prod (inert); no real-browser run yet | present M5 plan, stop before coding

## Update template

`Date | milestone | changed files | tested (commands/results) | remaining risk | next action`
