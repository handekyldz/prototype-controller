import { beforeEach, describe, expect, it } from "vitest";
import { BindingsDocument, Scenario } from "@prototype-controller/schema";
import { createController, type Controller, type Scheduler } from "../src/index.ts";

/** Deterministic scheduler: timers run only when flushed. */
function manualScheduler() {
  const pending = new Map<number, () => void>();
  let next = 0;
  const scheduler: Scheduler = {
    setTimeout: (fn) => {
      pending.set(++next, fn);
      return next;
    },
    clearTimeout: (h) => void pending.delete(h as number),
  };
  const flush = () => {
    const fns = [...pending.values()];
    pending.clear();
    fns.forEach((fn) => fn());
  };
  return { scheduler, flush, pendingCount: () => pending.size };
}

function scenario(retryOutcomes: ("success" | "error")[] = ["success"], extra: Partial<Record<string, unknown>> = {}) {
  return Scenario.parse({
    schemaVersion: 1,
    id: "upload.partial-failure",
    title: "One of three files fails",
    scope: "flow",
    flowIds: ["upload-documents"],
    targets: ["upload.panel", "upload.file-list"],
    initial: "idle",
    phases: {
      idle: { "upload.file-list": "empty" },
      uploading: { "upload.panel": "uploading", "upload.file-list": "file-uploading" },
      "partial-error": { "upload.file-list": "partial-error" },
      retrying: { "upload.panel": "uploading", "upload.file-list": "file-uploading" },
      success: { "upload.file-list": "file-done" },
    },
    steps: [
      {
        on: "SELECT_FILES",
        from: "idle",
        to: "uploading",
        effects: [{ kind: "mock-upload", outcomes: ["success", "success", "error"], settle: { mode: "auto", delayMs: 100 } }],
      },
      { on: "UPLOAD_SETTLED", from: "uploading", to: "partial-error", guard: "some-failed" },
      { on: "UPLOAD_SETTLED", from: "uploading", to: "success", guard: "none-failed" },
      {
        on: "RETRY_FAILED_FILE",
        from: "partial-error",
        to: "retrying",
        effects: [{ kind: "mock-retry", outcomes: retryOutcomes, settle: { mode: "auto", delayMs: 100 } }],
      },
      { on: "RETRY_SETTLED", from: "retrying", to: "partial-error", guard: "some-failed" },
      { on: "RETRY_SETTLED", from: "retrying", to: "success", guard: "none-failed" },
    ],
    ...extra,
  });
}

const bindings = BindingsDocument.parse({
  schemaVersion: 1,
  bindings: [
    { targetId: "upload.file-list", stateId: "partial-error", mode: "use-existing", origin: "existing-component", owner: "designer", status: "ready", visualLocked: true, componentKey: "UploadPartialError" },
    { targetId: "upload.file-list", stateId: "loading", mode: "generate", origin: "generated", owner: "controller", status: "ready", visualLocked: false, componentKey: "GeneratedFileListLoading" },
    { targetId: "upload.panel", stateId: "permission-denied", mode: "provide-later", origin: "pending", owner: "designer", status: "unmapped", visualLocked: true, reason: "Designer will provide it later." },
  ],
});

const baselineStates = [
  { targetId: "upload.file-list", stateId: "empty" },
  { targetId: "upload.panel", stateId: "uploading" },
  { targetId: "upload.file-list", stateId: "file-uploading" },
  { targetId: "upload.file-list", stateId: "file-done" },
];

const files = [
  { id: "a", name: "a.pdf", size: 1 },
  { id: "b", name: "b.pdf", size: 2 },
  { id: "c", name: "c.pdf", size: 3 },
];

let timers: ReturnType<typeof manualScheduler>;
let controller: Controller;

function setup(scenarios = [scenario()], enabled = true) {
  timers = manualScheduler();
  controller = createController({ scenarios, bindings, baselineStates, enabled, scheduler: timers.scheduler });
}

const statuses = () => Object.fromEntries(controller.getState().files.map((f) => [f.id, `${f.status}:${f.attempts}`]));

beforeEach(() => setup());

describe("activation", () => {
  it("activates a valid scenario at its initial phase", () => {
    expect(controller.activate("upload.partial-failure")).toEqual({ ok: true });
    expect(controller.getState().phase).toBe("idle");
    expect(controller.targetState("upload.file-list")).toBe("empty");
  });

  it("rejects unknown scenarios, unknown and unmapped states without partial changes", () => {
    const bad = scenario(["success"], {
      id: "upload.bad",
      phases: {
        ...scenario().phases,
        idle: { "upload.panel": "permission-denied", "upload.file-list": "ghost" },
      },
    });
    setup([bad]);
    const before = controller.getState();
    expect(controller.activate("upload.nope")).toEqual({ ok: false, errors: ["unknown scenario 'upload.nope'"] });
    const result = controller.activate("upload.bad");
    expect(result).toEqual({
      ok: false,
      errors: [
        "state 'upload.panel/permission-denied' is unmapped: Designer will provide it later.",
        "unknown state 'upload.file-list/ghost'",
      ],
    });
    const after = controller.getState();
    expect(after.scenario).toBeNull();
    expect(after.generation).toBe(before.generation);
    expect(after.error).toContain("unmapped");
  });

  it("rejects cross-flow scenarios in v0.1", () => {
    setup([scenario(["success"], { scope: "cross-flow" })]);
    expect(controller.activate("upload.partial-failure")).toEqual({
      ok: false,
      errors: ["cross-flow scenarios are not supported in v0.1"],
    });
  });
});

describe("events", () => {
  it("ignores events without an active scenario or outside their phase", () => {
    controller.dispatch({ type: "SELECT_FILES", files });
    expect(controller.getState().files).toEqual([]);

    controller.activate("upload.partial-failure");
    const before = controller.getState();
    controller.dispatch({ type: "RETRY_FAILED_FILE" });
    const after = controller.getState();
    expect(after.phase).toBe("idle");
    expect(after.files).toBe(before.files);
    expect(after.eventLog.at(-1)).toMatchObject({ type: "RETRY_FAILED_FILE", accepted: false, detail: "not allowed in phase 'idle'" });
  });

  it("applies deterministic mock outcomes: a and b succeed, c fails", () => {
    controller.activate("upload.partial-failure");
    controller.dispatch({ type: "SELECT_FILES", files });
    expect(controller.getState().phase).toBe("uploading");
    expect(statuses()).toEqual({ a: "uploading:1", b: "uploading:1", c: "uploading:1" });
    timers.flush();
    expect(controller.getState().phase).toBe("partial-error");
    expect(statuses()).toEqual({ a: "done:1", b: "done:1", c: "error:1" });
  });

  it("does not log file names", () => {
    controller.activate("upload.partial-failure");
    controller.dispatch({ type: "SELECT_FILES", files });
    expect(JSON.stringify(controller.getState().eventLog)).not.toContain(".pdf");
  });
});

describe("retry isolation", () => {
  it("retries only the failed file and keeps completed uploads", () => {
    controller.activate("upload.partial-failure");
    controller.dispatch({ type: "SELECT_FILES", files });
    timers.flush();
    const [a, b] = controller.getState().files;

    controller.dispatch({ type: "RETRY_FAILED_FILE" });
    expect(controller.getState().phase).toBe("retrying");
    expect(statuses()).toEqual({ a: "done:1", b: "done:1", c: "uploading:2" });
    expect(controller.getState().files.slice(0, 2)).toEqual([a, b]);

    timers.flush();
    expect(controller.getState().phase).toBe("success");
    expect(statuses()).toEqual({ a: "done:1", b: "done:1", c: "done:2" });
  });

  it("keeps the file in error when the retry fails too", () => {
    setup([scenario(["error"])]);
    controller.activate("upload.partial-failure");
    controller.dispatch({ type: "SELECT_FILES", files });
    timers.flush();
    controller.dispatch({ type: "RETRY_FAILED_FILE" });
    timers.flush();
    expect(controller.getState().phase).toBe("partial-error");
    expect(statuses()).toEqual({ a: "done:1", b: "done:1", c: "error:2" });
  });
});

describe("reset and stale completions", () => {
  it("reset cancels pending simulated uploads and returns to baseline", () => {
    controller.activate("upload.partial-failure");
    controller.dispatch({ type: "SELECT_FILES", files });
    controller.setOverride({ targetId: "upload.file-list", stateId: "loading" });
    expect(timers.pendingCount()).toBe(1);

    controller.reset();
    expect(timers.pendingCount()).toBe(0);
    const state = controller.getState();
    expect(state).toMatchObject({ scenario: null, phase: null, files: [], manualOverride: null, error: null });
    expect(controller.targetState("upload.file-list")).toBeUndefined();
  });

  it("ignores a completion from an earlier generation", () => {
    controller.activate("upload.partial-failure");
    controller.dispatch({ type: "SELECT_FILES", files });
    const oldGeneration = controller.getState().generation;

    controller.activate("upload.partial-failure");
    controller.dispatch({ type: "SELECT_FILES", files: [files[0]!] });
    controller.dispatch({ type: "UPLOAD_SETTLED", generation: oldGeneration });

    expect(controller.getState().phase).toBe("uploading");
    expect(controller.getState().eventLog.at(-1)).toMatchObject({ accepted: false, detail: `stale completion from generation ${oldGeneration}` });
  });

  it("settle() resolves in-flight uploads on demand", () => {
    controller.activate("upload.partial-failure");
    controller.dispatch({ type: "SELECT_FILES", files });
    controller.settle();
    expect(timers.pendingCount()).toBe(0);
    expect(controller.getState().phase).toBe("partial-error");
  });
});

describe("manual overrides", () => {
  it("applies only to its own target; siblings keep the scenario state", () => {
    controller.activate("upload.partial-failure");
    controller.dispatch({ type: "SELECT_FILES", files });
    expect(controller.setOverride({ targetId: "upload.file-list", stateId: "loading" })).toEqual({ ok: true });
    expect(controller.targetState("upload.file-list")).toBe("loading");
    expect(controller.targetState("upload.panel")).toBe("uploading");
  });

  it("rejects a competing override on the same target instead of last-write-wins", () => {
    controller.setOverride({ targetId: "upload.file-list", stateId: "loading" });
    const result = controller.setOverride({ targetId: "upload.file-list", stateId: "partial-error" });
    expect(result.ok).toBe(false);
    expect(controller.getState().error).toMatch(/^conflict: 'upload.file-list' is already overridden/);
    expect(controller.targetState("upload.file-list")).toBe("loading");
  });

  it("allows one override at a time and rejects unmapped states", () => {
    controller.setOverride({ targetId: "upload.file-list", stateId: "loading" });
    expect(controller.setOverride({ targetId: "upload.panel", stateId: "uploading" }).ok).toBe(false);
    controller.clearOverride();
    expect(controller.setOverride({ targetId: "upload.panel", stateId: "permission-denied" })).toEqual({
      ok: false,
      errors: ["state 'upload.panel/permission-denied' is unmapped: Designer will provide it later."],
    });
  });
});

describe("disabled mode", () => {
  it("has no effect at all", () => {
    setup([scenario()], false);
    const before = controller.getState();
    expect(controller.activate("upload.partial-failure").ok).toBe(false);
    controller.dispatch({ type: "SELECT_FILES", files });
    controller.setOverride({ targetId: "upload.file-list", stateId: "loading" });
    controller.reset();
    expect(controller.getState()).toBe(before);
    expect(timers.pendingCount()).toBe(0);
  });
});
