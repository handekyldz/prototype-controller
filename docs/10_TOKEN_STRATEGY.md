# Token-Conscious Claude Code Workflow

**Goal:** lower unnecessary context and rework, not necessarily the smallest total response in every step.

## Session routine

1. One milestone or one narrow bug per session. Start with the corresponding file in `prompts/`.
2. `CLAUDE.md` is always present; open only the 1–3 linked specs needed for that task. Never paste the entire pack into chat.
3. Ask Claude to list relevant filenames/symbols before reading code; avoid `cat` on whole directories or massive test logs.
4. Demand a changed-file plan and a STOP after each acceptance gate. Do not let Claude implement M1–M5 in one session.
5. When an answer is known, record it in `docs/08_DECISIONS.md` rather than re-discussing it.
6. Run smallest applicable tests first; widen only if changed interfaces warrant it.
7. Keep generated code concise and focused; avoid adding unneeded dependencies, agents, hooks or speculative abstractions.
8. End with a **short handoff** in `docs/09_WORKLOG.md`, then a fresh session for the next milestone.

## Prompt pattern

```text
Read CLAUDE.md, docs/09_WORKLOG.md and [the two relevant specs].
Task: [one bounded deliverable].
Before edits: <=5-bullet plan and exact files.
Do not touch unrelated files or add dependencies without need.
Run [specific tests].
Output only: changed files, pass/fail evidence, unresolved risks.
Update WORKLOG.md and stop.
```

## What not to do

- Avoid repeated broad `explore the entire codebase` requests once the target flow is known.
- Do not load all doc files into each new session.
- Do not auto-spawn parallel subagents for simple file edits; they can increase **total** token spend even if they save main-context space.
- Do not request screenshot-by-screenshot redesign unless needed for a currently unmapped state.
- Do not repeatedly ask Claude to rewrite the plan; update only the affected decision and milestone entry.
- Avoid pasting huge stack traces: use first relevant error and file location.

## Budget guardrail (process, not numeric token guarantee)

If a task starts expanding, stop after compiling/tests and request a one-paragraph scope delta. Save work, update worklog and address expansion in a new narrowly-scoped session. Actual token usage depends on codebase size, model, tools and conversation history.
