---
name: remove
description: Remove the prototype controller from the designer's project and restore the prototype exactly as it was before integration. Use when the designer wants to uninstall the controller, panel or integrated states.
---

# Remove the prototype controller

Undo the `integrate` skill so the prototype runs exactly as before.

## Steps

1. Find every integration point:
   - `src/prototype-controller/` (all integration code);
   - marked seams: `grep -rn "prototype-controller" src index.html .env.development`;
   - `src/main.tsx` dev-only mount.
2. Show the designer the list of files to delete and seams to revert, and ask for confirmation once.
3. Revert each seam to its original form:
   - **Target wrapper:** keep the wrapped children, drop `<Target …>` and its closing tag.
   - **Resource adapter:** delete the `useSimulatedFiles` line and the marked early return.
   - **main.tsx:** restore the single `root.render(<StrictMode><App /></StrictMode>)` call.
   - **Imports:** delete the marked imports.
   - **`.env.development`:** delete the `VITE_PROTOTYPE_CONTROLLER` line. Delete the file if nothing else is left in it.

   If the integration was committed separately, prefer `git diff <pre-integration-commit> -- <file>` to restore seams precisely.
4. Delete `src/prototype-controller/`.
5. Keep `.prototype-controller/`. It holds the designer's discovery answers and references. Delete it only if the designer asks.
6. Verify:
   - `grep -rn "prototype-controller" src` finds nothing.
   - Typecheck and `npm run build` pass.
   - If the pre-integration commit is known, `git diff <commit> -- src` is empty.

   Report the results honestly.
