import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import "./styles.css";

const root = createRoot(document.getElementById("root")!);

// Opt-in, development only. The import is dynamic so production bundles never include it.
if (import.meta.env.DEV && import.meta.env.VITE_PROTOTYPE_CONTROLLER === "on") {
  const { withPrototypeController } = await import("./prototype/devtools.tsx");
  root.render(<StrictMode>{withPrototypeController(<App />)}</StrictMode>);
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
