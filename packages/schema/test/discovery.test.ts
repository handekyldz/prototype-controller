import { describe, expect, it } from "vitest";
import { DiscoveryResult } from "../src/index.ts";

const evidence = [{ file: "src/a.tsx", line: 3, symbol: "foo" }];

function makeResult(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    project: { name: "demo", framework: "react-vite" },
    flows: [
      {
        id: "upload-documents",
        summary: "Upload",
        status: "observed",
        confidence: "high",
        evidence,
        targets: [{ id: "upload.panel", summary: "Panel", status: "observed", confidence: "high", evidence }],
        states: [],
        edgeCases: [],
        questions: [],
        notFound: [],
        ...overrides,
      },
    ],
  };
}

function issues(input: unknown) {
  const parsed = DiscoveryResult.safeParse(input);
  return parsed.success ? [] : parsed.error.issues.map((i) => i.message);
}

describe("DiscoveryResult schema", () => {
  it("accepts a minimal valid result", () => {
    expect(issues(makeResult())).toEqual([]);
  });

  it("requires evidence for observed findings", () => {
    const result = makeResult({
      states: [{ id: "idle", targetId: "upload.panel", summary: "s", status: "observed", confidence: "high", evidence: [] }],
    });
    expect(issues(result)).toContain("observed findings need evidence");
  });

  it("requires a rationale for inferred findings", () => {
    const result = makeResult({
      edgeCases: [
        { id: "timeout", dimension: "network", targetIds: ["upload.panel"], summary: "s", status: "inferred", confidence: "low", evidence: [] },
      ],
    });
    expect(issues(result)).toContain("inferred findings need a rationale");
  });

  it("rejects references to unknown targets and ids", () => {
    const result = makeResult({
      states: [{ id: "idle", targetId: "upload.missing", summary: "s", status: "observed", confidence: "high", evidence }],
      questions: [{ id: "q1", question: "?", recommendedDefault: "d", consequence: "c", relatedIds: ["nope"] }],
    });
    expect(issues(result)).toEqual(["unknown target 'upload.missing'", "unknown id 'nope'"]);
  });

  it("rejects duplicate ids within a flow", () => {
    const result = makeResult({
      states: [{ id: "upload.panel", targetId: "upload.panel", summary: "s", status: "observed", confidence: "high", evidence }],
    });
    expect(issues(result)).toContain("duplicate id 'upload.panel'");
  });

  it("rejects absolute or escaping evidence paths", () => {
    const result = makeResult({ evidence: [{ file: "/etc/passwd", line: 1, symbol: "x" }] });
    expect(issues(result)).toContain("file must be a project-relative path");
    const escaping = makeResult({ evidence: [{ file: "../secret.ts", line: 1, symbol: "x" }] });
    expect(issues(escaping)).toContain("file must be a project-relative path");
  });
});
