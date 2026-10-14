import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { Controller, RuntimeState, StateBinding } from "@prototype-controller/runtime";

const ControllerContext = createContext<Controller | null>(null);

type ProviderProps = { controller: Controller; children: ReactNode };

export function PrototypeControllerProvider({ controller, children }: ProviderProps) {
  return <ControllerContext.Provider value={controller}>{children}</ControllerContext.Provider>;
}

const noopSubscribe = () => () => {};
const noState = () => null;

/** The controller, or null when the prototype runs without one (disabled mode). */
export function useController(): Controller | null {
  const controller = useContext(ControllerContext);
  return controller?.enabled ? controller : null;
}

export function useRuntimeState(): RuntimeState | null {
  const controller = useController();
  const getState = controller?.getState ?? noState;
  return useSyncExternalStore(controller?.subscribe ?? noopSubscribe, getState, getState);
}

export type TargetState = { stateId: string; binding: StateBinding | undefined };

/** Resolved state of a target, or null when no scenario/override controls it. */
export function useTargetState(targetId: string): TargetState | null {
  const controller = useController();
  useRuntimeState();
  const stateId = controller?.targetState(targetId);
  if (!controller || !stateId) return null;
  return { stateId, binding: controller.bindingFor(targetId, stateId) };
}

type TargetProps = {
  /** Stable semantic target id, e.g. `upload.file-list`. */
  id: string;
  /**
   * Render functions per state id. Each receives the original UI (`baseline`) so a state
   * can replace it or render next to it. States without an entry show the baseline.
   */
  states: Partial<Record<string, (baseline: ReactNode) => ReactNode>>;
  children: ReactNode;
};

/**
 * Wraps existing UI without adding DOM. Shows the bound state when a scenario or
 * preview controls this target; otherwise renders `children` unchanged.
 */
export function Target({ id, states, children }: TargetProps) {
  const target = useTargetState(id);
  const render = target ? states[target.stateId] : undefined;
  return <>{render ? render(children) : children}</>;
}

export type SimulatedFiles = {
  files: RuntimeState["files"];
  isUploading: boolean;
  selectFiles: (files: File[]) => void;
  retryFailed: (fileId?: string) => void;
};

/**
 * Resource adapter for upload flows: while a scenario is active, file statuses come
 * from the simulated runtime (no real requests). Returns null otherwise, so the
 * prototype's own upload logic runs unchanged.
 */
export function useSimulatedFiles(): SimulatedFiles | null {
  const controller = useController();
  const state = useRuntimeState();
  if (!controller || !state?.scenario) return null;
  return {
    files: state.files,
    isUploading: state.files.some((f) => f.status === "uploading"),
    selectFiles: (files) =>
      controller.dispatch({
        type: "SELECT_FILES",
        files: files.map((f) => ({ id: crypto.randomUUID(), name: f.name, size: f.size })),
      }),
    retryFailed: (fileId) => controller.dispatch({ type: "RETRY_FAILED_FILE", ...(fileId ? { fileId } : {}) }),
  };
}
