import { BindingsDocument, DiscoveryResult, Presentation, Scenario } from "@prototype-controller/schema";
import { createController, type ControllerOptions } from "@prototype-controller/runtime";
import bindingsJson from "../../.prototype-controller/bindings.json";
import discoveryJson from "../../.prototype-controller/discovery.json";
import partialFailureDemoJson from "../../.prototype-controller/presentations/upload.partial-failure.json";
import partialFailureJson from "../../.prototype-controller/scenarios/upload.partial-failure.json";
import permissionDeniedJson from "../../.prototype-controller/scenarios/upload.permission-denied.json";
import slowJson from "../../.prototype-controller/scenarios/upload.slow.json";

export const discovery = DiscoveryResult.parse(discoveryJson);

export const flows = discovery.flows.map((f) => ({ id: f.id, title: f.summary }));

export const presentations = [Presentation.parse(partialFailureDemoJson)];

/** Observed states the prototype already renders on its own. */
const baselineStates = discovery.flows.flatMap((flow) =>
  flow.states.filter((s) => s.status !== "inferred").map((s) => ({ targetId: s.targetId, stateId: s.id })),
);

export function createPrototypeController(overrides: Partial<ControllerOptions> = {}) {
  return createController({
    scenarios: [partialFailureJson, slowJson, permissionDeniedJson].map((s) => Scenario.parse(s)),
    bindings: BindingsDocument.parse(bindingsJson),
    baselineStates,
    ...overrides,
  });
}
