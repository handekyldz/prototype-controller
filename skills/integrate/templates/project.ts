// prototype-controller project config. Written by the integrate skill; safe to edit.
// The type annotations make TypeScript check every document against the runtime types.
import { createController, type BindingsDocument, type Presentation, type Scenario } from "./lib/runtime";

export const flows = [{ id: "upload-documents", title: "Upload documents" }];

/** One entry per target/state the designer decided on (generate / use-existing / provide-later). */
export const bindings: BindingsDocument = {
  schemaVersion: 1,
  bindings: [
    {
      targetId: "upload.file-list",
      stateId: "partial-error",
      mode: "use-existing",
      origin: "existing-component",
      owner: "designer",
      status: "ready",
      visualLocked: true,
      componentKey: "ErrorNotice",
    },
    {
      targetId: "upload.file-list",
      stateId: "loading",
      mode: "generate",
      origin: "generated",
      owner: "controller",
      status: "ready",
      visualLocked: false,
      componentKey: "GeneratedFileListLoading",
    },
    {
      targetId: "upload.panel",
      stateId: "permission-denied",
      mode: "provide-later",
      origin: "pending",
      owner: "designer",
      status: "unmapped",
      visualLocked: true,
      reason: "Designer will provide this design later.",
    },
  ],
};

/** States the prototype already renders by itself (observed in discovery). */
export const baselineStates = [
  { targetId: "upload.file-list", stateId: "empty" },
  { targetId: "upload.panel", stateId: "uploading" },
  { targetId: "upload.file-list", stateId: "file-done" },
];

/** Upload scenarios. v0.1 events: SELECT_FILES, UPLOAD_SETTLED, RETRY_FAILED_FILE, RETRY_SETTLED. */
export const scenarios: Scenario[] = [
  {
    schemaVersion: 1,
    id: "upload.partial-failure",
    title: "One file fails, the rest upload",
    scope: "flow",
    flowIds: ["upload-documents"],
    targets: ["upload.panel", "upload.file-list"],
    initial: "idle",
    phases: {
      idle: { "upload.file-list": "empty" },
      uploading: { "upload.panel": "uploading" },
      "partial-error": { "upload.file-list": "partial-error" },
      retrying: { "upload.panel": "uploading" },
      success: { "upload.file-list": "file-done" },
    },
    steps: [
      {
        on: "SELECT_FILES",
        from: "idle",
        to: "uploading",
        effects: [{ kind: "mock-upload", outcomes: ["error"], settle: { mode: "auto", delayMs: 1200 } }],
      },
      { on: "UPLOAD_SETTLED", from: "uploading", to: "partial-error", guard: "some-failed", effects: [] },
      { on: "UPLOAD_SETTLED", from: "uploading", to: "success", guard: "none-failed", effects: [] },
      {
        on: "RETRY_FAILED_FILE",
        from: "partial-error",
        to: "retrying",
        effects: [{ kind: "mock-retry", outcomes: ["success"], settle: { mode: "auto", delayMs: 1200 } }],
      },
      { on: "RETRY_SETTLED", from: "retrying", to: "partial-error", guard: "some-failed", effects: [] },
      { on: "RETRY_SETTLED", from: "retrying", to: "success", guard: "none-failed", effects: [] },
    ],
  },
];

export const presentations: Presentation[] = [
  {
    schemaVersion: 1,
    id: "upload.partial-failure-demo",
    title: "Partial upload failure and recovery",
    scenarioId: "upload.partial-failure",
    intro: "Empty upload panel",
    steps: [
      {
        title: "Upload three documents",
        action: { type: "select-files", files: [{ name: "Report.pdf", sizeKb: 840 }, { name: "Contract.pdf", sizeKb: 312 }, { name: "Photo.jpg", sizeKb: 2650 }] },
        expectPhase: "uploading",
      },
      { title: "Report.pdf fails, the others upload", action: { type: "settle" }, expectPhase: "partial-error" },
      {
        title: "Retry the failed file",
        action: { type: "await-prototype", event: "RETRY_FAILED_FILE", hint: "Click Retry in the prototype" },
        expectPhase: "retrying",
      },
      { title: "Retry succeeds", action: { type: "settle" }, expectPhase: "success" },
    ],
  },
];

export function createProjectController() {
  return createController({ scenarios, bindings, baselineStates });
}
