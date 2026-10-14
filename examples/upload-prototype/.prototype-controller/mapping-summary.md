# Mapping summary — upload-documents (M2)

| Target / state | Origin | Owner | Status | Visual change |
|---|---|---|---|---|
| upload.file-list / partial-error | existing-component (`ErrorNotice`) | designer | ready | None. Adapter maps props only; markup identical to direct render (tested). Copy passed in by the adapter is a proposal for designer review. |
| upload.file-list / loading | generated | controller | ready | New skeleton rows; reuses `.file-list`/`.file-row` and colors from `src/styles.css`. Inferred state, not in discovery. |
| upload.file-list / file-too-large | design-reference (text) | designer | needs-review | Proposed from `references/file-too-large.md`. No screenshot; no fidelity claim. |
| upload.panel / permission-denied | pending | designer | unmapped | None. Designer provides later. |

Unchanged existing files: `src/App.tsx`, `src/upload/*`, `src/styles.css`, `src/components/ErrorNotice.*`.
Nothing is wired into the running app yet (runtime is M3).
