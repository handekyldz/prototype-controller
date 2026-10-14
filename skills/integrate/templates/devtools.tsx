// prototype-controller dev tools. Loaded only by the dev-only dynamic import in main.tsx.
import type { ReactNode } from "react";
import { PrototypeControllerProvider } from "./lib/react";
import { ControllerPanel } from "./lib/react/panel";
import { createProjectController, flows, presentations } from "./project";

export function withPrototypeController(app: ReactNode) {
  const controller = createProjectController();
  return (
    <PrototypeControllerProvider controller={controller}>
      {app}
      <ControllerPanel controller={controller} flows={flows} presentations={presentations} />
    </PrototypeControllerProvider>
  );
}
