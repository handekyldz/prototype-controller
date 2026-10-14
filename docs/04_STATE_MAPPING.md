# State Mapping & Ownership Contract

## Two input paths plus generation

1. **Existing component**: find a real exported component (or accept explicit path), inspect props/events and preserve its appearance.
2. **Design reference**: designer supplies screenshot, Figma screenshot or written design description. Generate an implementation **for review**; do not claim pixel-perfect recreation or direct Figma access.
3. **Generated**: no existing design; generate from project tokens, layout patterns and content conventions.

## Per-state decision (not per-project)

For each `(targetId, stateId)` store:

- `mode`: `generate | use-existing | provide-later` (designer intent).
- `origin`: `generated | existing-component | design-reference | pending` (where implementation came from).
- `owner`: `designer | controller` (who may authorize visual changes).
- `status`: `ready | needs-review | unmapped`.
- `componentKey`: build-time registry key, optional until ready.
- `visualLocked`: whether visual changes require explicit designer approval.

`origin` and `owner` are separate: a component generated from a designer's screenshot may be `origin=design-reference`, `owner=designer`, `status=needs-review` until accepted.

## Mapping procedure

1. Determine stable target IDs and affected region (`upload.file-list`, not the entire app).
2. Read the baseline component and the proposed state/reference. Compare unchanged vs changed regions: navigation, header, content, CTA, status copy.
3. Map state component via typed registry, not arbitrary JSON imports.
4. Inspect button/event wiring; adapt behaviors using callback props, wrapper adapters or targeted event handlers.
5. Produce a **visual diff summary** and changed-files list; request approval if a designer-owned component's visual structure must change.
6. Mark `ready` only after mount/render and interaction checks succeed.

## Rules of engagement

- Existing UI: avoid modifying layout, CSS, copy, colors or assets. If behavior must be added, prefer callback/adapter hooks with identical visuals.
- Pending: leave an explicit missing state and a clear integration path. Do not quietly generate replacement UI.
- Reference-based generation: verify typography, spacing, responsive behavior, CTA presence and semantic accessibility with designer before marking ready.
- Fallback: unsupported source remains `unmapped` with a reason; controller clearly says it cannot execute the state.
- Generated states should have sensible accessibility: live-region announcements for async states, actionable retry labels, focus handling for errors.

## Example

```yaml
- targetId: upload.file-list
  stateId: partial-error
  mode: use-existing
  origin: existing-component
  owner: designer
  componentKey: UploadPartialError
  visualLocked: true
  status: ready
- targetId: upload.panel
  stateId: loading
  mode: generate
  origin: generated
  owner: controller
  componentKey: GeneratedUploadLoading
  visualLocked: false
  status: ready
- targetId: upload.panel
  stateId: permission-denied
  mode: provide-later
  origin: pending
  owner: designer
  status: unmapped
```
