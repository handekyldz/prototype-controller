# Decision Log — Locked Product Decisions

These were explicitly chosen by the product designer. Claude must not reopen them without an actual implementation blocker.

| ID | Decision | Rationale |
|---|---|---|
| D-01 | **Hybrid intelligence** | Automatically cover obvious states, ask focused questions for consequential UX behavior. |
| D-02 | **Per-state ownership**: generate / use existing / provide later | Designer controls visual ownership independently for every target/state. |
| D-03 | **Both designer inputs**: existing component AND screenshot/Figma screenshot/text reference | Designer may provide UI as code or as a reference; direct Figma integration is later. |
| D-04 | **Hybrid hierarchy**: component, page, flow; cross-flow model later | Both local and multi-component scenarios are needed. |
| D-05 | **Interaction-first** | State transitions and recovery must work through real prototype interaction. |
| D-06 | **Claude Code plugin + React runtime** | Skills handle reasoning/integration; deterministic runtime controls UI. MCP not necessary in MVP. |
| D-07 | **Initial scope: React + Vite + TypeScript, multi-file upload** | Validates an end-to-end slice without framework explosion. |
| D-08 | **Preserve designer-owned visuals** | Behavior can be connected; visual changes require explicit approval. |
| D-09 | **Explore and lightweight Present modes** | Support design analysis and stakeholder demonstrations. |
| D-10 | **One active scenario in MVP** | Predictable runtime; scoped manual target override only when nonconflicting. |

## Implementation assumptions (revisable with evidence)

- TypeScript for schema/runtime/react; use a small monorepo.
- A typed registry maps manifest keys to compiled components; no dynamic execution from JSON.
- Store versioned project decisions under `.prototype-controller/` in the target app.
- Use mocking adapters rather than auto-intercepting all requests.

## Unresolved questions — do not block M1

- Final package name and license.
- Preferred repo tooling/package manager if existing tooling contradicts pnpm suggestion.
- Screenshot input handoff shape for target projects; begin with an explicit local file path and designer approval.
