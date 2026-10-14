---
name: integrate
description: Add edge-case states and a dev-only floating prototype controller to the designer's own React + Vite prototype, after discovery. Asks per state whether to generate it, use an existing component or provide it later, then wires scenarios (e.g. partial upload failure with a working Retry) without changing existing visuals. Use when the designer wants to try, demo or present states in their prototype.
---

# Integrate states into the prototype

Turn approved discovery into working, demoable states **inside the designer's project**. The designer then runs `npm run dev`, opens the **Prototype controller** panel (bottom right) and triggers states. Real clicks in the prototype, such as Retry, drive recovery.

`${CLAUDE_PLUGIN_ROOT}` below is this plugin's root directory.

## Hard rules

- Never change the look of existing components: no layout, CSS, copy, color or asset edits. Connect behavior through adapters and marked seams only.
- All new code goes under `src/prototype-controller/`. Edits to existing files are minimal seams, and every seam line carries a marker: `// prototype-controller` (or `{/* prototype-controller */}` in JSX). This keeps removal exact.
- No real network writes from simulations, no new npm dependencies, no production enablement. The panel loads only in `npm run dev`.
- `provide-later` states stay unmapped, with a reason. Never substitute a generated design for them.
- Do not claim screenshot fidelity. States generated from a screenshot or text reference stay `needs-review` until the designer accepts them.
- Re-running is an update, not a duplicate: edit existing config and seams in place.

## 0. Preconditions

1. Check `package.json` for `react` and `vite`, and that the project uses TypeScript. If not, stop: v0.1 supports React + Vite + TypeScript only.
2. Read `.prototype-controller/discovery.json`. If it is missing, run the `discover` skill first and get the designer's approval of its summary.
3. Run `git status --porcelain`. If there are uncommitted changes, say so and recommend committing first so the integration is a separate diff. Continue only if the designer agrees.

## 1. Decide states with the designer

From discovery, build a short checklist per target. Include observed states as baseline, plus the inferred edge cases worth demoing. For each proposed state recommend one mode:

- `generate`: Claude builds it from project conventions.
- `use-existing`: name the real component you found (path plus export) that already renders it, e.g. an error notice or empty state.
- `provide-later`: the designer will supply it later. Keep it unmapped.

Ask at most **3 questions per round**, each with a recommended default and its consequence. Prioritize data preservation, recovery and layout. Offer routine states as a checklist to accept or edit. If the designer says "use defaults", take every recommendation. Record answers in `discovery.json`: set `answer` on questions and `confirmed` on accepted findings.

**Scenarios.** v0.1 simulates **file-upload flows** (events `SELECT_FILES`, `UPLOAD_SETTLED`, `RETRY_FAILED_FILE`, `RETRY_SETTLED`). For an upload flow, offer *partial failure with Retry* and *slow upload* (manual finish). For other flows, still integrate the states, but tell the designer they can preview them from the panel's **States** list. Full simulated scenarios for those flows are not available yet.

## 2. Copy the runtime

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/integrate/scripts/install-runtime.mjs" .
```

This writes `src/prototype-controller/lib/`. It is plain TypeScript with React as the only dependency. Never edit files there.

## 3. Write the project config

Create or update `src/prototype-controller/project.ts`, starting from `${CLAUDE_PLUGIN_ROOT}/skills/integrate/templates/project.ts`:

- `flows`: id and title from discovery.
- `bindings`: one entry per decided target and state. Rules: `use-existing` → `origin: "existing-component"`, `owner: "designer"`, `visualLocked: true`. `generate` → `origin: "generated"` (or `"design-reference"` with `reference` and `status: "needs-review"`). `provide-later` → `origin: "pending"`, `status: "unmapped"`, a `reason`, and no `componentKey`.
- `baselineStates`: observed discovery states the UI already renders.
- `scenarios` and `presentations`: adapt the template's upload scenarios to the real target ids. Every phase may reference only baseline or bound (non-unmapped) states. Settle steps need `effects: []`.

Keep the type annotations (`: Scenario[]` etc., not `satisfies`); they make TypeScript validate the documents. Outcomes apply by selection order and missing entries succeed, so `["error"]` makes the first selected file fail whatever the count. Prefer that over failing the *n*-th file.

## 4. Build the state components

- **Generated** → `src/prototype-controller/states/<Name>.tsx`. Reuse the project's existing class names, CSS variables and spacing, and do not restyle globals. Make them accessible: `role="status"` with `aria-live` for async states, `role="alert"` for errors, real `<button>` elements with clear labels.
- **Use existing** → `src/prototype-controller/adapters/<Name>.tsx`. Render the designer's component and only map data and callbacks to its existing props. The markup must stay identical to rendering it directly.
- **Design reference** → generate the component as a proposal, store the reference under `.prototype-controller/references/`, and mark the binding `needs-review`.

## 5. Add the seams (show the plan first)

List the exact seam edits for designer-owned files and ask once for approval. Then apply them:

**a. Target wrapper** around the existing UI region. It adds no DOM. Without an active state it renders `children` unchanged:

```tsx
import { Target } from "../prototype-controller/lib/react"; // prototype-controller

<Target id="upload.file-list" states={{ // prototype-controller
  "partial-error": (baseline) => <>{baseline}<UploadPartialError /></>,
  loading: () => <GeneratedFileListLoading />,
}}>
  <FileList items={items} />
</Target>{/* prototype-controller */}
```

**b. Upload resource adapter** in the hook or component that owns upload state. Simulated files replace real uploads only while a scenario is active:

```ts
const simulated = useSimulatedFiles(); // prototype-controller
// ...existing hook body unchanged...
if (simulated) return { /* map simulated.files / selectFiles / retryFailed to this hook's shape */ }; // prototype-controller
```

Call hooks unconditionally, before any early return. Connect the error state's Retry button to `simulated.retryFailed()` through the adapter's props, so the **real prototype button** drives recovery.

**c. Dev-only mount** in `src/main.tsx`. The dynamic import keeps it out of production bundles:

```tsx
if (import.meta.env.DEV && import.meta.env.VITE_PROTOTYPE_CONTROLLER === "on") { // prototype-controller
  const { withPrototypeController } = await import("./prototype-controller/devtools"); // prototype-controller
  root.render(<StrictMode>{withPrototypeController(<App />)}</StrictMode>); // prototype-controller
} else { // prototype-controller
  root.render(<StrictMode><App /></StrictMode>);
} // prototype-controller
```

Copy `${CLAUDE_PLUGIN_ROOT}/skills/integrate/templates/devtools.tsx` to `src/prototype-controller/devtools.tsx`. Add `VITE_PROTOTYPE_CONTROLLER=on # prototype-controller` to `.env.development`, creating the file if needed.

## 6. Verify

Run each check and report pass or fail honestly:

1. Typecheck: the project's script, or `npx tsc -b` / `npx tsc --noEmit`.
2. `npm run build`.
3. Production check: search the build output, e.g. `grep -rl "Prototype controller" dist`. It must find nothing.
4. The project's own tests, if any.
5. `git diff --stat`: the only edits outside `src/prototype-controller/` are marked seams and `.env.development`.
6. Seams shift line numbers. Update the `line` of any `discovery.json` evidence in edited files so that each `symbol` is again on its line.

If a check fails, fix it within these rules or report the blocker. Do not weaken the rules to make a check pass.

## 7. Hand over

Tell the designer, briefly:

- **Changed files:** new files, plus each seam edit.
- **How to try:** `npm run dev`, open **Prototype controller** (bottom right), **Activate** a scenario, then use the prototype normally. For partial failure: pick 3 files, wait, click **Retry** in the prototype. Use **Present** for a step-by-step demo and **Reset to baseline** to start over.
- **Still open:** states left `needs-review` or `provide-later`.
- **How to remove:** run the `remove` skill.
