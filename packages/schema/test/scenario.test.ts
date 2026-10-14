import { describe, expect, it } from "vitest";
import { Scenario } from "../src/index.ts";

const valid = {
  schemaVersion: 1,
  id: "upload.partial-failure",
  title: "One of three files fails",
  scope: "flow",
  flowIds: ["upload-documents"],
  targets: ["upload.file-list"],
  initial: "idle",
  phases: { idle: { "upload.file-list": "empty" }, uploading: {} },
  steps: [
    {
      on: "SELECT_FILES",
      from: "idle",
      to: "uploading",
      effects: [{ kind: "mock-upload", outcomes: ["error"], settle: { mode: "manual" } }],
    },
  ],
};

function issues(input: unknown) {
  const parsed = Scenario.safeParse(input);
  return parsed.success ? [] : parsed.error.issues.map((i) => i.message);
}

describe("Scenario schema", () => {
  it("accepts a valid scenario", () => {
    expect(issues(valid)).toEqual([]);
  });

  it("rejects other schema versions with a clear message", () => {
    expect(issues({ ...valid, schemaVersion: "0.1" })).toEqual(['unsupported schemaVersion "0.1"; expected 1']);
  });

  it("rejects unknown phases and unlisted targets", () => {
    const bad = {
      ...valid,
      initial: "nope",
      phases: { ...valid.phases, uploading: { "upload.panel": "uploading" } },
      steps: [{ ...valid.steps[0], to: "done" }],
    };
    expect(issues(bad)).toEqual([
      "unknown phase 'nope'",
      "target 'upload.panel' is not listed in targets",
      "unknown phase 'done'",
    ]);
  });

  it("requires the matching mock effect and rejects effects on settle steps", () => {
    const missing = { ...valid, steps: [{ on: "SELECT_FILES", from: "idle", to: "uploading" }] };
    expect(issues(missing)).toEqual(["SELECT_FILES steps need a mock-upload effect"]);
    const extra = { ...valid, steps: [{ ...valid.steps[0], on: "UPLOAD_SETTLED" }] };
    expect(issues(extra)).toEqual(["UPLOAD_SETTLED steps take no effects"]);
  });

  it("rejects unknown event types instead of executing strings", () => {
    const bad = { ...valid, steps: [{ ...valid.steps[0], on: "alert('x')" }] };
    expect(issues(bad).length).toBeGreaterThan(0);
  });
});
