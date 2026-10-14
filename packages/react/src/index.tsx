import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { StateBinding } from "@prototype-controller/schema";
import type { Controller, RuntimeState } from "@prototype-controller/runtime";

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
