import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { collectEvidence, DiscoveryResult } from "@prototype-controller/schema";
import expected from "./discovery.expected.json";

// Checks the golden discovery result for this fixture: shape, classification and
// that every evidence pointer matches real source. It does not exercise the skill itself.
const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const result = DiscoveryResult.parse(expected);
const flow = result.flows[0]!;

describe("upload-prototype discovery result", () => {
  it("detects the upload flow and its targets", () => {
    expect(flow.id).toBe("upload-documents");
    expect(flow.status).toBe("observed");
    expect(flow.targets.map((t) => t.id)).toEqual(["upload.panel", "upload.file-list"]);
  });

  it("classifies partial failure as inferred, not observed", () => {
    const partial = flow.edgeCases.find((e) => e.id === "partial-failure");
    expect(partial?.status).toBe("inferred");
    expect(partial?.rationale).toBeTruthy();
    expect(flow.states.some((s) => s.id.includes("fail"))).toBe(false);
  });

  it("asks at most 3 questions in one round", () => {
    expect(flow.questions.length).toBeLessThanOrEqual(3);
  });

  it.each(collectEvidence(result).map((e) => [`${e.file}:${e.line}`, e] as const))(
    "evidence %s exists in source",
    (_, e) => {
      const lines = readFileSync(new URL(e.file, `file://${projectRoot}`), "utf8").split("\n");
      expect(lines[e.line - 1]).toContain(e.symbol);
    },
  );
});
