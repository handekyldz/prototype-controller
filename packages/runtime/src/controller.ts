import type { BindingsDocument, Scenario, StateBinding } from "@prototype-controller/schema";
import {
  baseline,
  reduce,
  resolveTargetState,
  type Action,
  type Command,
  type PrototypeEvent,
  type RuntimeState,
  type TargetOverride,
} from "./reducer.ts";

export type Scheduler = {
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
};

export type ControllerOptions = {
  scenarios: Scenario[];
  bindings: BindingsDocument;
  /** States the prototype already renders itself (from discovery), e.g. `upload.file-list/empty`. */
  baselineStates: TargetOverride[];
  /** When false every call is a no-op and the prototype runs untouched. */
  enabled?: boolean;
  scheduler?: Scheduler;
};

export type Result = { ok: true } | { ok: false; errors: string[] };

export type Controller = {
  readonly enabled: boolean;
  readonly scenarios: readonly Scenario[];
  readonly bindings: readonly StateBinding[];
  getState(): RuntimeState;
  subscribe(listener: () => void): () => void;
  /** Whether a scenario could be activated, without changing state. */
  check(scenarioId: string): Result;
  activate(scenarioId: string): Result;
  reset(): void;
  dispatch(event: PrototypeEvent): void;
  /** Settle in-flight simulated uploads now (for `manual` settle or stepping a demo). */
  settle(): void;
  setOverride(override: TargetOverride): Result;
  clearOverride(): void;
  targetState(targetId: string): string | undefined;
  bindingFor(targetId: string, stateId: string): StateBinding | undefined;
};

const disabledResult: Result = { ok: false, errors: ["prototype controller is disabled"] };

export function createController(options: ControllerOptions): Controller {
  const enabled = options.enabled ?? true;
  const scheduler: Scheduler = options.scheduler ?? {
    setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
    clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
  };
  const bindings = new Map(options.bindings.bindings.map((b) => [`${b.targetId}/${b.stateId}`, b]));
  const baselineStates = new Set(options.baselineStates.map((s) => `${s.targetId}/${s.stateId}`));
  const listeners = new Set<() => void>();
  const timers = new Set<unknown>();
  let state = baseline;

  function stateProblem(targetId: string, stateId: string): string | null {
    const key = `${targetId}/${stateId}`;
    if (baselineStates.has(key)) return null;
    const binding = bindings.get(key);
    if (!binding) return `unknown state '${key}'`;
    if (binding.status === "unmapped") return `state '${key}' is unmapped: ${binding.reason}`;
    return null;
  }

  function scenarioProblems(scenarioId: string): string[] {
    const scenario = options.scenarios.find((s) => s.id === scenarioId);
    if (!scenario) return [`unknown scenario '${scenarioId}'`];
    const errors: string[] = [];
    if (scenario.scope === "cross-flow") errors.push("cross-flow scenarios are not supported in v0.1");
    for (const map of Object.values(scenario.phases)) {
      for (const [targetId, stateId] of Object.entries(map)) {
        const problem = stateProblem(targetId, stateId);
        if (problem && !errors.includes(problem)) errors.push(problem);
      }
    }
    return errors;
  }

  function cancelTimers() {
    timers.forEach((t) => scheduler.clearTimeout(t));
    timers.clear();
  }

  function run(commands: Command[]) {
    for (const command of commands) {
      const handle = scheduler.setTimeout(() => {
        timers.delete(handle);
        apply(command.event);
      }, command.delayMs);
      timers.add(handle);
    }
  }

  function apply(action: Action) {
    if (action.type === "ACTIVATE" || action.type === "RESET") cancelTimers();
    const result = reduce(state, action);
    if (result.state !== state) {
      state = result.state;
      listeners.forEach((l) => l());
    }
    run(result.commands);
  }

  function fail(action: string, errors: string[]): Result {
    apply({ type: "REJECT", action, error: errors.join("; ") });
    return { ok: false, errors };
  }

  return {
    enabled,
    scenarios: options.scenarios,
    bindings: options.bindings.bindings,
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    check(scenarioId) {
      if (!enabled) return disabledResult;
      const errors = scenarioProblems(scenarioId);
      return errors.length > 0 ? { ok: false, errors } : { ok: true };
    },
    activate(scenarioId) {
      if (!enabled) return disabledResult;
      const errors = scenarioProblems(scenarioId);
      if (errors.length > 0) return fail("ACTIVATE", errors);
      apply({ type: "ACTIVATE", scenario: options.scenarios.find((s) => s.id === scenarioId)! });
      return { ok: true };
    },
    reset() {
      if (enabled) apply({ type: "RESET" });
    },
    dispatch(event) {
      if (enabled) apply(event);
    },
    settle() {
      if (!enabled || !state.scenario) return;
      const uploading = state.files.some((f) => f.status === "uploading");
      if (!uploading) return;
      // Retried files have attempts > 1; first uploads settle with UPLOAD_SETTLED.
      const retrying = state.files.some((f) => f.status === "uploading" && f.attempts > 1);
      cancelTimers();
      apply({ type: retrying ? "RETRY_SETTLED" : "UPLOAD_SETTLED", generation: state.generation });
    },
    setOverride(override) {
      if (!enabled) return disabledResult;
      const problem = stateProblem(override.targetId, override.stateId);
      if (problem) return fail("SET_OVERRIDE", [problem]);
      apply({ type: "SET_OVERRIDE", override });
      const current = state.manualOverride;
      const applied = current?.targetId === override.targetId && current.stateId === override.stateId;
      return applied ? { ok: true } : { ok: false, errors: [state.error ?? "override rejected"] };
    },
    clearOverride() {
      if (enabled) apply({ type: "CLEAR_OVERRIDE" });
    },
    targetState: (targetId) => resolveTargetState(state, targetId),
    bindingFor: (targetId, stateId) => bindings.get(`${targetId}/${stateId}`),
  };
}
