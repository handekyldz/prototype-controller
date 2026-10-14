import { BindingsDocument, DiscoveryResult, Scenario } from "@prototype-controller/schema";
import { createController, type ControllerOptions } from "@prototype-controller/runtime";
import bindingsJson from "../../.prototype-controller/bindings.json";
import discoveryJson from "../../.prototype-controller/discovery.json";
import partialFailureJson from "../../.prototype-controller/scenarios/upload.partial-failure.json";

const discovery = DiscoveryResult.parse(discoveryJson);

/** Observed states the prototype already renders on its own. */
const baselineStates = discovery.flows.flatMap((flow) =>
  flow.states.filter((s) => s.status !== "inferred").map((s) => ({ targetId: s.targetId, stateId: s.id })),
);

export function createPrototypeController(overrides: Partial<ControllerOptions> = {}) {
  return createController({
    scenarios: [Scenario.parse(partialFailureJson)],
    bindings: BindingsDocument.parse(bindingsJson),
    baselineStates,
    ...overrides,
  });
}
