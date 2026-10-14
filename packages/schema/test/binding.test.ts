import { describe, expect, it } from "vitest";
import { BindingsDocument, checkRegistry, StateBinding } from "../src/index.ts";

const ready = {
  targetId: "upload.panel",
  stateId: "loading",
  mode: "generate",
  origin: "generated",
  owner: "controller",
  status: "ready",
  visualLocked: false,
  componentKey: "GeneratedLoading",
};

function issues(input: unknown) {
  const parsed = StateBinding.safeParse(input);
  return parsed.success ? [] : parsed.error.issues.map((i) => i.message);
}

describe("StateBinding schema", () => {
  it("accepts a ready generated binding", () => {
    expect(issues(ready)).toEqual([]);
  });

  it("keeps existing components designer-owned and visually locked", () => {
    const existing = { ...ready, mode: "use-existing", origin: "existing-component", owner: "controller", visualLocked: false };
    expect(issues(existing)).toEqual(["existing components are designer-owned", "existing components must be visually locked"]);
  });

  it("keeps reference-based states in review until accepted", () => {
    const reference = { kind: "text", path: "refs/a.md", accepted: false };
    const binding = { ...ready, origin: "design-reference", owner: "designer", visualLocked: true, reference };
    expect(issues(binding)).toEqual(["reference-based states stay needs-review until the designer accepts them"]);
    expect(issues({ ...binding, status: "needs-review" })).toEqual([]);
    expect(issues({ ...binding, reference: { ...reference, accepted: true } })).toEqual([]);
  });

  it("requires a reference for design-reference origin and rejects absolute paths", () => {
    const binding = { ...ready, origin: "design-reference", owner: "designer", status: "needs-review" };
    expect(issues(binding)).toContain("design-reference requires a reference");
    expect(issues({ ...binding, reference: { kind: "screenshot", path: "/tmp/a.png", accepted: false } })).toContain(
      "path must be project-relative",
    );
  });

  it("keeps pending states unmapped with a reason and no component", () => {
    const pending = { ...ready, mode: "provide-later", origin: "pending", owner: "designer" };
    expect(issues(pending)).toEqual(["provide-later states stay unmapped", "pending states have no component"]);
    const { componentKey: _, ...rest } = pending;
    expect(issues({ ...rest, status: "unmapped" })).toEqual(["unmapped states need a reason"]);
    expect(issues({ ...rest, status: "unmapped", reason: "later" })).toEqual([]);
  });

  it("requires a componentKey unless unmapped", () => {
    const { componentKey: _, ...rest } = ready;
    expect(issues(rest)).toEqual(["ready states need a componentKey"]);
  });
});

describe("BindingsDocument", () => {
  it("rejects duplicate target/state pairs", () => {
    const parsed = BindingsDocument.safeParse({ schemaVersion: 1, bindings: [ready, ready] });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe("duplicate binding 'upload.panel/loading'");
  });

  it("reports componentKeys missing from the registry", () => {
    const doc = BindingsDocument.parse({ schemaVersion: 1, bindings: [ready] });
    expect(checkRegistry(doc, ["GeneratedLoading"])).toEqual([]);
    expect(checkRegistry(doc, [])).toEqual(["upload.panel/loading: componentKey 'GeneratedLoading' is not in the registry"]);
  });
});
