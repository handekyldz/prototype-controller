// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { App } from "../src/App.tsx";
import { createPrototypeController } from "../src/prototype/controller.ts";
import { withPrototypeController } from "../src/prototype/devtools.tsx";

afterEach(cleanup);

const inertScheduler = { setTimeout: () => 0, clearTimeout: () => {} };

function setup() {
  const controller = createPrototypeController({ scheduler: inertScheduler });
  render(withPrototypeController(<App />, controller));
  return controller;
}

function openPanel() {
  fireEvent.click(screen.getByRole("button", { name: /Prototype controller/ }));
  return screen.getByRole("region", { name: "Prototype controller" });
}

function selectFiles(names: string[]) {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
  fireEvent.change(input, { target: { files: names.map((n) => new File(["x"], n)) } });
}

function scenarioItem(panel: HTMLElement, title: string) {
  return within(panel).getByText(title).closest("li")!;
}

describe("controller panel — Explore", () => {
  it("is collapsed by default and leaves the prototype untouched", () => {
    setup();
    const toggle = screen.getByRole("button", { name: /Prototype controller/ });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("region", { name: "Prototype controller" })).toBeNull();
    expect(screen.getByText("No files uploaded yet.")).toBeTruthy();
  });

  it("shows ready and blocked scenarios with the reason, and filters by scope", () => {
    setup();
    const panel = openPanel();
    expect(within(scenarioItem(panel, "One of three files fails")).getByText("Ready")).toBeTruthy();
    const blocked = scenarioItem(panel, "User may not upload");
    expect(within(blocked).getByText("Blocked")).toBeTruthy();
    expect(within(blocked).getByText(/is unmapped: Designer will provide/)).toBeTruthy();
    expect((within(blocked).getByRole("button", { name: /Activate/ }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(within(panel).getByLabelText("Scope"), { target: { value: "component" } });
    expect(within(panel).queryByText("One of three files fails")).toBeNull();
    expect(within(panel).getByText("User may not upload")).toBeTruthy();
  });

  it("runs partial failure from the panel; recovery happens through the prototype's Retry", () => {
    const controller = setup();
    const panel = openPanel();
    fireEvent.click(within(panel).getByRole("button", { name: "Activate One of three files fails" }));

    selectFiles(["a.pdf", "b.pdf", "c.pdf"]);
    fireEvent.click(within(panel).getByRole("button", { name: "Finish uploads" }));
    expect(screen.getByText("c.pdf couldn't be uploaded")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Retry upload" }));
    expect(controller.getState().files.map((f) => f.attempts)).toEqual([1, 1, 2]);
    fireEvent.click(within(panel).getByRole("button", { name: "Finish uploads" }));
    expect(controller.getState().phase).toBe("success");

    fireEvent.click(within(panel).getByRole("button", { name: "Reset to baseline" }));
    expect(screen.getByText("No files uploaded yet.")).toBeTruthy();
    expect(within(panel).getByText("No scenario active. The prototype runs as built.")).toBeTruthy();
  });

  it("previews a state on its target and shows a visible conflict for a competing preview", () => {
    setup();
    const panel = openPanel();
    fireEvent.click(within(panel).getByRole("button", { name: "Preview upload.file-list / loading" }));
    expect(screen.getByRole("status").textContent).toContain("Loading files…");
    expect(within(panel).getByRole("button", { name: "Preview upload.file-list / loading" }).getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(within(panel).getByRole("button", { name: "Preview upload.file-list / file-too-large" }));
    expect(within(panel).getByRole("alert").textContent).toMatch(/^conflict: 'upload.file-list' is already overridden to 'loading'/);
    expect(screen.getByRole("status").textContent).toContain("Loading files…");

    fireEvent.click(within(panel).getByRole("button", { name: "Clear preview (upload.file-list)" }));
    expect(screen.queryByRole("status")).toBeNull();
    expect(within(panel).queryByRole("alert")).toBeNull();
  });

  it("closes with Escape and returns focus to the toggle", () => {
    setup();
    const panel = openPanel();
    const scope = within(panel).getByLabelText("Scope");
    scope.focus();
    fireEvent.keyDown(scope, { key: "Escape" });
    const toggle = screen.getByRole("button", { name: /Prototype controller/ });
    expect(screen.queryByRole("region", { name: "Prototype controller" })).toBeNull();
    expect(document.activeElement).toBe(toggle);
  });
});

describe("controller panel — Present", () => {
  it("steps forward, waits for the real Retry click, and steps back deterministically", () => {
    const controller = setup();
    const panel = openPanel();
    fireEvent.click(within(panel).getByRole("button", { name: "Present" }));
    fireEvent.click(within(panel).getByRole("button", { name: "Start presentation" }));
    expect(within(panel).getByText("Step 0 of 4")).toBeTruthy();

    fireEvent.click(within(panel).getByRole("button", { name: "Next: Upload three documents" }));
    fireEvent.click(within(panel).getByRole("button", { name: "Next: Two succeed, one fails" }));
    expect(screen.getByText("Site-photo.jpg couldn't be uploaded")).toBeTruthy();

    const next = within(panel).getByRole("button", { name: "Next: Retry the failed file" }) as HTMLButtonElement;
    expect(next.disabled).toBe(true);
    expect(within(panel).getByText(/Click “Retry upload” in the prototype/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Retry upload" }));
    expect(within(panel).getByText("Step 3 of 4")).toBeTruthy();
    fireEvent.click(within(panel).getByRole("button", { name: "Next: Retry succeeds" }));
    expect(controller.getState().phase).toBe("success");
    expect(within(panel).getByText("Step 4 of 4")).toBeTruthy();

    fireEvent.click(within(panel).getByRole("button", { name: "Previous" }));
    expect(within(panel).getByText("Step 3 of 4")).toBeTruthy();
    expect(controller.getState().phase).toBe("retrying");
    expect(controller.getState().files.map((f) => f.status)).toEqual(["done", "done", "uploading"]);
  });

  it("flags an interrupted presentation after a reset", () => {
    const controller = setup();
    const panel = openPanel();
    fireEvent.click(within(panel).getByRole("button", { name: "Present" }));
    fireEvent.click(within(panel).getByRole("button", { name: "Start presentation" }));
    act(() => controller.reset());
    expect(within(panel).getByRole("alert").textContent).toBe("The presentation was interrupted. Restart to continue.");
  });
});
