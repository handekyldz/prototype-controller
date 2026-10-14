import type { ReactNode } from "react";
import { PrototypeControllerProvider } from "@prototype-controller/react";
import { ControllerPanel } from "@prototype-controller/react/panel";
import { createPrototypeController, flows, presentations } from "./controller.ts";

/** Development-only: wraps the app with the controller and its floating panel. */
export function withPrototypeController(app: ReactNode, controller = createPrototypeController()) {
  return (
    <PrototypeControllerProvider controller={controller}>
      {app}
      <ControllerPanel controller={controller} flows={flows} presentations={presentations} />
    </PrototypeControllerProvider>
  );
}
