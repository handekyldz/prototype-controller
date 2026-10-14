# Prompt 01 — M1 Discovery Vertical Slice

Read `CLAUDE.md`, `docs/09_WORKLOG.md`, `docs/03_DISCOVERY_PROTOCOL.md`, and the M1 section of `docs/06_IMPLEMENTATION_PLAN.md`. Consult `docs/02_ARCHITECTURE.md` only for plugin layout.

Build **M1 only**:

- Minimal React + Vite + TypeScript multi-file upload happy-path fixture (if absent).
- `.claude-plugin/plugin.json` and `skills/discover/SKILL.md` matching current Claude Code format.
- Discovery result model for flows, targets, observed states, inferred cases, evidence and unanswered decisions.
- Focused tests showing detection of upload flow, one inferred partial failure case and evidence from real paths.

Before editing, give <=5 bullets and exact files. Do not create UI controller, scenario runtime, state generator or other skills. Minimize new dependencies. Run targeted tests and `claude plugin validate .` if CLI exists; otherwise document not-run status. Update worklog and STOP at M1 gate.
