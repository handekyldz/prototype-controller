/**
 * Plain document types used by the runtime, React hooks and panel. Kept free of
 * validation libraries so the runtime can be copied into a prototype with no extra
 * dependencies. `@prototype-controller/schema` validates the same shapes and has a
 * type test asserting both stay in sync.
 */

export type ScenarioEventType = "SELECT_FILES" | "UPLOAD_SETTLED" | "RETRY_FAILED_FILE" | "RETRY_SETTLED";
export type StepGuard = "some-failed" | "none-failed";
export type MockOutcome = "success" | "error";
export type Settle = { mode: "auto"; delayMs: number } | { mode: "manual" };

export type ScenarioEffect =
  | { kind: "mock-upload"; outcomes: MockOutcome[]; settle: Settle }
  | { kind: "mock-retry"; outcomes: MockOutcome[]; settle: Settle };

export type ScenarioStep = {
  on: ScenarioEventType;
  from: string;
  to: string;
  guard?: StepGuard;
  effects: ScenarioEffect[];
};

export type ScenarioScope = "component" | "page" | "flow" | "cross-flow";

export type Scenario = {
  schemaVersion: 1;
  id: string;
  title: string;
  scope: ScenarioScope;
  flowIds: string[];
  targets: string[];
  initial: string;
  /** phase id → (target id → state id) shown while in that phase. */
  phases: Record<string, Record<string, string>>;
  steps: ScenarioStep[];
};

export type BindingMode = "generate" | "use-existing" | "provide-later";
export type BindingOrigin = "generated" | "existing-component" | "design-reference" | "pending";
export type BindingOwner = "designer" | "controller";
export type BindingStatus = "ready" | "needs-review" | "unmapped";

export type DesignReference = { kind: "screenshot" | "text"; path: string; accepted: boolean };

export type StateBinding = {
  targetId: string;
  stateId: string;
  mode: BindingMode;
  origin: BindingOrigin;
  owner: BindingOwner;
  status: BindingStatus;
  visualLocked: boolean;
  componentKey?: string;
  reference?: DesignReference;
  reason?: string;
};

export type BindingsDocument = { schemaVersion: 1; bindings: StateBinding[] };

export type PresentationAction =
  | { type: "select-files"; files: { name: string; sizeKb: number }[] }
  | { type: "settle" }
  | { type: "await-prototype"; event: "RETRY_FAILED_FILE"; hint: string };

export type PresentationStep = {
  title: string;
  note?: string;
  action: PresentationAction;
  expectPhase: string;
};

export type Presentation = {
  schemaVersion: 1;
  id: string;
  title: string;
  scenarioId: string;
  intro: string;
  steps: PresentationStep[];
};
