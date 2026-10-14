// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { PrototypeControllerProvider } from "@prototype-controller/react";
import { App } from "../src/App.tsx";
import { createPrototypeController } from "../src/prototype/controller.ts";
import { uploadFile } from "../src/upload/uploadFile.ts";

vi.mock("../src/upload/uploadFile.ts", async (importOriginal) => {
  const original = await importOriginal<typeof import("../src/upload/uploadFile.ts")>();
  return { uploadFile: vi.fn(original.uploadFile) };
});

afterEach(() => {
  cleanup();
  vi.mocked(uploadFile).mockClear();
});

/** Scheduler that never fires on its own; tests settle explicitly. */
const inertScheduler = { setTimeout: () => 0, clearTimeout: () => {} };

function selectFiles(names: string[]) {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
  const files = names.map((name) => new File(["x".repeat(2048)], name));
  fireEvent.change(input, { target: { files } });
}

function rowStatus(name: string) {
  const row = screen.getByText(name).closest("li")!;
  return within(row).getByText(/Uploading…|Uploaded/).textContent;
}

describe("partial upload failure through the real prototype UI", () => {
  it("shows 2 successes + 1 failure, and the prototype's own Retry re-uploads only the failed file", () => {
    const controller = createPrototypeController({ scheduler: inertScheduler });
    render(
      <PrototypeControllerProvider controller={controller}>
        <App />
      </PrototypeControllerProvider>,
    );
    act(() => void controller.activate("upload.partial-failure"));

    selectFiles(["a.pdf", "b.pdf", "c.pdf"]);
    expect(screen.getByText("Uploading files…")).toBeTruthy();
    act(() => controller.settle());

    expect(rowStatus("a.pdf")).toBe("Uploaded");
    expect(rowStatus("b.pdf")).toBe("Uploaded");
    expect(screen.getByRole("alert").textContent).toContain("c.pdf couldn't be uploaded");

    const before = controller.getState().files;
    fireEvent.click(screen.getByRole("button", { name: "Retry upload" }));

    const retrying = controller.getState().files;
    expect(retrying.filter((f) => f.status === "uploading").map((f) => f.name)).toEqual(["c.pdf"]);
    expect(retrying.slice(0, 2)).toEqual(before.slice(0, 2));
    expect(rowStatus("c.pdf")).toBe("Uploading…");
    expect(screen.queryByRole("alert")).toBeNull();

    act(() => controller.settle());
    expect(["a.pdf", "b.pdf", "c.pdf"].map(rowStatus)).toEqual(["Uploaded", "Uploaded", "Uploaded"]);
    expect(controller.getState().files.map((f) => f.attempts)).toEqual([1, 1, 2]);
    expect(uploadFile).not.toHaveBeenCalled();

    act(() => controller.reset());
    expect(screen.getByText("No files uploaded yet.")).toBeTruthy();
  });
});

describe("disabled mode", () => {
  it("renders identical markup with no provider, an idle provider or a disabled controller", () => {
    const plain = renderToStaticMarkup(<App />);
    const idle = renderToStaticMarkup(
      <PrototypeControllerProvider controller={createPrototypeController()}>
        <App />
      </PrototypeControllerProvider>,
    );
    const disabled = renderToStaticMarkup(
      <PrototypeControllerProvider controller={createPrototypeController({ enabled: false })}>
        <App />
      </PrototypeControllerProvider>,
    );
    expect(idle).toBe(plain);
    expect(disabled).toBe(plain);
  });

  it("keeps the original upload flow when the controller is disabled", () => {
    const controller = createPrototypeController({ enabled: false });
    render(
      <PrototypeControllerProvider controller={controller}>
        <App />
      </PrototypeControllerProvider>,
    );
    controller.activate("upload.partial-failure");
    selectFiles(["a.pdf"]);
    expect(uploadFile).toHaveBeenCalledTimes(1);
    expect(rowStatus("a.pdf")).toBe("Uploading…");
    expect(controller.getState().files).toEqual([]);
  });
});
