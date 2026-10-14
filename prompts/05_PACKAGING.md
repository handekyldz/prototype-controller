# Prompt 05 — M5 Plugin Packaging and Release Readiness

Read `CLAUDE.md`, `docs/09_WORKLOG.md`, M5 section of `docs/06_IMPLEMENTATION_PLAN.md` and `docs/07_TEST_STRATEGY.md`. Inspect actual implementation before edits.

Build **M5 only**:

- Complete `skills/analyze/SKILL.md` and `skills/integrate/SKILL.md` using approved discovery/mapping contracts.
- Document integration into an existing React/Vite project, opt-in enablement, and clean removal.
- Validate plugin with `claude plugin validate .`; test a local session with `claude --plugin-dir .` when available.
- Run build, typecheck, focused tests, a clean-project smoke test and production-disabled check. Report not-run honestly.
- Write minimal public-facing README, limitations and a release checklist.

Do not publish/install globally, change user settings or create a marketplace without my explicit request. Provide brief pass/fail matrix, update worklog and STOP.
