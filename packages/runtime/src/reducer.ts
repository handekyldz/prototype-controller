import type { MockOutcome, Scenario, ScenarioEffect, ScenarioStep, StepGuard } from "./types.ts";

export type SelectedFile = { id: string; name: string; size: number };

/** Semantic prototype events. Settle events carry the generation that scheduled them. */
export type PrototypeEvent =
  | { type: "SELECT_FILES"; files: SelectedFile[] }
  | { type: "UPLOAD_SETTLED"; generation: number }
  | { type: "RETRY_FAILED_FILE"; fileId?: string }
  | { type: "RETRY_SETTLED"; generation: number };

export type FileStatus = "uploading" | "done" | "error";

/** Simulated file resource. `pendingOutcome` is applied when the upload settles. */
export type SimulatedFile = SelectedFile & {
  status: FileStatus;
  attempts: number;
  pendingOutcome?: MockOutcome;
};

export type TargetOverride = { targetId: string; stateId: string };

/** Log entries hold event types and counts only; never file names or contents. */
export type LogEntry = {
  generation: number;
  type: string;
  accepted: boolean;
  detail?: string;
};

export type RuntimeState = {
  /** Bumped on activate/reset; settle events from older generations are stale. */
  generation: number;
  scenario: Scenario | null;
  phase: string | null;
  files: SimulatedFile[];
  manualOverride: TargetOverride | null;
  eventLog: LogEntry[];
  /** Last visible rejection (validation failure or conflict). */
  error: string | null;
};

export type Action =
  | { type: "ACTIVATE"; scenario: Scenario }
  | { type: "RESET" }
  | { type: "REJECT"; action: string; error: string }
  | { type: "SET_OVERRIDE"; override: TargetOverride }
  | { type: "CLEAR_OVERRIDE" }
  | PrototypeEvent;

/** Side effects for the controller to run. The reducer itself never schedules anything. */
export type Command = { kind: "schedule"; event: PrototypeEvent; delayMs: number };

export type ReduceResult = { state: RuntimeState; commands: Command[] };

const MAX_LOG = 100;

export const baseline: RuntimeState = {
  generation: 0,
  scenario: null,
  phase: null,
  files: [],
  manualOverride: null,
  eventLog: [],
  error: null,
};

function log(state: RuntimeState, entry: Omit<LogEntry, "generation">, generation = state.generation): LogEntry[] {
  return [...state.eventLog, { generation, ...entry }].slice(-MAX_LOG);
}

function reject(state: RuntimeState, type: string, detail: string): ReduceResult {
  return { state: { ...state, eventLog: log(state, { type, accepted: false, detail }) }, commands: [] };
}

function outcomeAt(effect: ScenarioEffect | undefined, index: number): MockOutcome {
  return effect?.outcomes[index] ?? "success";
}

/** Resource changes an event would cause under a given step. Pure. */
function applyEvent(files: SimulatedFile[], event: PrototypeEvent, step: ScenarioStep): SimulatedFile[] | string {
  const effect = step.effects[0];
  switch (event.type) {
    case "SELECT_FILES": {
      if (event.files.length === 0) return "no files selected";
      const added = event.files.map((f, i) => ({
        ...f,
        status: "uploading" as const,
        attempts: 1,
        pendingOutcome: outcomeAt(effect, i),
      }));
      return [...files, ...added];
    }
    case "RETRY_FAILED_FILE": {
      const failed = files.filter((f) => f.status === "error" && (!event.fileId || f.id === event.fileId));
      if (failed.length === 0) return "no failed files to retry";
      const retryIds = new Set(failed.map((f) => f.id));
      let i = 0;
      return files.map((f) =>
        retryIds.has(f.id)
          ? { ...f, status: "uploading" as const, attempts: f.attempts + 1, pendingOutcome: outcomeAt(effect, i++) }
          : f,
      );
    }
    case "UPLOAD_SETTLED":
    case "RETRY_SETTLED":
      return files.map((f) => {
        if (f.status !== "uploading") return f;
        const { pendingOutcome, ...rest } = f;
        return { ...rest, status: pendingOutcome === "error" ? ("error" as const) : ("done" as const) };
      });
  }
}

function guardPasses(guard: StepGuard | undefined, files: SimulatedFile[]): boolean {
  if (!guard) return true;
  const someFailed = files.some((f) => f.status === "error");
  return guard === "some-failed" ? someFailed : !someFailed;
}

function scheduleFor(event: PrototypeEvent, step: ScenarioStep, generation: number): Command[] {
  const effect = step.effects[0];
  if (!effect || effect.settle.mode !== "auto") return [];
  const type = event.type === "SELECT_FILES" ? "UPLOAD_SETTLED" : "RETRY_SETTLED";
  return [{ kind: "schedule", event: { type, generation }, delayMs: effect.settle.delayMs }];
}

function handleEvent(state: RuntimeState, event: PrototypeEvent): ReduceResult {
  const { scenario, phase } = state;
  if (!scenario || !phase) return reject(state, event.type, "no active scenario");
  if ("generation" in event && event.generation !== state.generation) {
    return reject(state, event.type, `stale completion from generation ${event.generation}`);
  }

  const candidates = scenario.steps.filter((s) => s.on === event.type && s.from === phase);
  if (candidates.length === 0) return reject(state, event.type, `not allowed in phase '${phase}'`);

  let firstProblem = "";
  for (const step of candidates) {
    const files = applyEvent(state.files, event, step);
    if (typeof files === "string") {
      firstProblem ||= files;
      continue;
    }
    if (!guardPasses(step.guard, files)) continue;
    const failed = files.filter((f) => f.status === "error").length;
    const next: RuntimeState = {
      ...state,
      phase: step.to,
      files,
      error: null,
      eventLog: log(state, { type: event.type, accepted: true, detail: `${phase} → ${step.to}; ${failed} failed` }),
    };
    return { state: next, commands: scheduleFor(event, step, state.generation) };
  }
  return reject(state, event.type, firstProblem || "no step guard matched");
}

/**
 * Pure transition function. Activation must be validated before dispatching ACTIVATE;
 * the reducer trusts that the scenario's targets and states are executable.
 */
export function reduce(state: RuntimeState, action: Action): ReduceResult {
  switch (action.type) {
    case "ACTIVATE": {
      const generation = state.generation + 1;
      const next: RuntimeState = {
        ...baseline,
        generation,
        scenario: action.scenario,
        phase: action.scenario.initial,
        eventLog: log(state, { type: "ACTIVATE", accepted: true, detail: action.scenario.id }, generation),
      };
      return { state: next, commands: [] };
    }
    case "RESET": {
      const generation = state.generation + 1;
      return { state: { ...baseline, generation, eventLog: log(state, { type: "RESET", accepted: true }, generation) }, commands: [] };
    }
    case "REJECT":
      return { state: { ...reject(state, action.action, action.error).state, error: action.error }, commands: [] };
    case "SET_OVERRIDE": {
      const current = state.manualOverride;
      const wanted = action.override;
      if (current && current.targetId === wanted.targetId && current.stateId === wanted.stateId) {
        return { state, commands: [] };
      }
      if (current) {
        const error =
          current.targetId === wanted.targetId
            ? `conflict: '${wanted.targetId}' is already overridden to '${current.stateId}'; clear it before choosing '${wanted.stateId}'`
            : `only one manual override at a time; clear '${current.targetId}' first`;
        return reduce(state, { type: "REJECT", action: "SET_OVERRIDE", error });
      }
      return {
        state: {
          ...state,
          manualOverride: wanted,
          error: null,
          eventLog: log(state, { type: "SET_OVERRIDE", accepted: true, detail: `${wanted.targetId}=${wanted.stateId}` }),
        },
        commands: [],
      };
    }
    case "CLEAR_OVERRIDE":
      return {
        state: { ...state, manualOverride: null, error: null, eventLog: log(state, { type: "CLEAR_OVERRIDE", accepted: true }) },
        commands: [],
      };
    default:
      return handleEvent(state, action);
  }
}

/**
 * State shown for a target: a manual override wins only on its own target;
 * otherwise the active phase decides. `undefined` means not controlled (baseline UI).
 */
export function resolveTargetState(state: RuntimeState, targetId: string): string | undefined {
  if (state.manualOverride?.targetId === targetId) return state.manualOverride.stateId;
  if (!state.scenario || !state.phase) return undefined;
  return state.scenario.phases[state.phase]?.[targetId];
}
