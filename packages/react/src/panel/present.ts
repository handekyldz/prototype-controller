import type { Controller, Presentation, PresentationStep, Result } from "@prototype-controller/runtime";

/** Perform one presentation step through the controller's public API. */
export function runStep(controller: Controller, step: PresentationStep, stepIndex: number): Result {
  const action = step.action;
  switch (action.type) {
    case "select-files":
      controller.dispatch({
        type: "SELECT_FILES",
        files: action.files.map((f, i) => ({ id: `present-${stepIndex}-${i}`, name: f.name, size: f.sizeKb * 1024 })),
      });
      break;
    case "settle":
      controller.settle();
      break;
    case "await-prototype":
      // Only used when replaying; live, the presenter clicks the real control.
      controller.dispatch({ type: action.event });
      break;
  }
  const phase = controller.getState().phase;
  return phase === step.expectPhase
    ? { ok: true }
    : { ok: false, errors: [`step "${step.title}" expected phase '${step.expectPhase}' but is '${phase}'`] };
}

/**
 * Deterministically rebuild the state after `completed` steps: re-activate the
 * scenario (fresh generation, pending timers cancelled) and re-run each step.
 */
export function replay(controller: Controller, presentation: Presentation, completed: number): Result {
  const activated = controller.activate(presentation.scenarioId);
  if (!activated.ok) return activated;
  for (let i = 0; i < completed; i++) {
    const result = runStep(controller, presentation.steps[i]!, i);
    if (!result.ok) return result;
  }
  return { ok: true };
}
