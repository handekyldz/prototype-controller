import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BindingsDocument, checkRegistry, DiscoveryResult } from "@prototype-controller/schema";
import bindingsJson from "../.prototype-controller/bindings.json";
import discoveryJson from "../.prototype-controller/discovery.json";
import { ErrorNotice } from "../src/components/ErrorNotice.tsx";
import { partialErrorNoticeProps, UploadPartialError } from "../src/prototype/adapters/UploadPartialError.tsx";
import { GeneratedFileListLoading } from "../src/prototype/generated/GeneratedFileListLoading.tsx";
import { ReferenceFileTooLarge } from "../src/prototype/reference/ReferenceFileTooLarge.tsx";
import { registry } from "../src/prototype/registry.ts";

const doc = BindingsDocument.parse(bindingsJson);
const binding = (stateId: string) => doc.bindings.find((b) => b.stateId === stateId)!;
const noop = () => {};

describe("upload-prototype state bindings", () => {
  it("resolves every componentKey through the typed registry", () => {
    expect(checkRegistry(doc, Object.keys(registry))).toEqual([]);
  });

  it("binds only targets found by discovery", () => {
    const targets = new Set(DiscoveryResult.parse(discoveryJson).flows.flatMap((f) => f.targets.map((t) => t.id)));
    expect(doc.bindings.filter((b) => !targets.has(b.targetId))).toEqual([]);
  });

  it("differentiates ready, needs-review and pending states", () => {
    expect(binding("partial-error")).toMatchObject({ origin: "existing-component", owner: "designer", status: "ready" });
    expect(binding("loading")).toMatchObject({ origin: "generated", owner: "controller", status: "ready" });
    expect(binding("file-too-large")).toMatchObject({ origin: "design-reference", status: "needs-review" });
    expect(binding("permission-denied")).toMatchObject({ origin: "pending", status: "unmapped" });
    expect(binding("permission-denied").componentKey).toBeUndefined();
  });
});

describe("designer-owned ErrorNotice via adapter", () => {
  it.each([[["a.pdf"]], [["a.pdf", "b.png"]]])("renders identical markup to the component itself (%j)", (names) => {
    const direct = renderToStaticMarkup(<ErrorNotice {...partialErrorNoticeProps(names, noop)} />);
    const adapted = renderToStaticMarkup(<UploadPartialError failedFileNames={names} onRetry={noop} />);
    expect(adapted).toBe(direct);
  });

  it("exposes a real, labelled retry button", () => {
    const html = renderToStaticMarkup(<UploadPartialError failedFileNames={["a.pdf", "b.png"]} onRetry={noop} />);
    expect(html).toContain('role="alert"');
    expect(html).toContain('<button type="button" class="error-notice__action">Retry 2 files</button>');
  });
});

describe("generated and reference states render", () => {
  it("generated loading announces itself to assistive tech", () => {
    const html = renderToStaticMarkup(<GeneratedFileListLoading />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Loading files…");
  });

  it("reference proposal renders from its props", () => {
    const html = renderToStaticMarkup(<ReferenceFileTooLarge fileName="big.mov" maxSizeMb={25} />);
    expect(html).toContain("big.mov");
    expect(html).toContain("Maximum size is 25 MB");
  });
});
