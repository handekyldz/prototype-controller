import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";

// Simulates a fresh `npm create vite -- --template react-ts` project: copies the runtime
// with the install script, adds the integrate templates, and typechecks with the
// template's strict compiler flags. Lives under the repo so React types resolve.
const repo = fileURLToPath(new URL("../../..", import.meta.url));
const project = join(repo, ".tmp/integrate-test");
const script = join(repo, "skills/integrate/scripts/install-runtime.mjs");

const viteTemplateTsconfig = {
  compilerOptions: {
    target: "es2023",
    lib: ["ES2023", "DOM"],
    module: "esnext",
    types: ["vite/client"],
    skipLibCheck: true,
    moduleResolution: "bundler",
    allowImportingTsExtensions: true,
    verbatimModuleSyntax: true,
    moduleDetection: "force",
    noEmit: true,
    jsx: "react-jsx",
    strict: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    erasableSyntaxOnly: true,
    noFallthroughCasesInSwitch: true,
  },
  include: ["src"],
};

afterAll(() => rmSync(project, { recursive: true, force: true }));

describe("integrate: install-runtime + templates", () => {
  rmSync(project, { recursive: true, force: true });
  mkdirSync(join(project, "src"), { recursive: true });
  writeFileSync(join(project, "tsconfig.json"), JSON.stringify(viteTemplateTsconfig));
  const run = () => execFileSync("node", [script, project], { encoding: "utf8" });

  it("copies a self-contained runtime with rewritten imports", () => {
    expect(run()).toContain("runtime copied to src/prototype-controller/lib (9 files)");
    const lib = join(project, "src/prototype-controller/lib");
    const hooks = readFileSync(join(lib, "react/index.tsx"), "utf8");
    expect(hooks).toContain('from "../runtime/index"');
    expect(hooks).not.toContain("@prototype-controller/");
    expect(readFileSync(join(lib, "runtime/controller.ts"), "utf8")).toContain('from "./reducer"');
    expect(existsSync(join(lib, "VERSION"))).toBe(true);
  });

  it("typechecks with the templates under Vite's strict template flags", () => {
    const dir = join(project, "src/prototype-controller");
    cpSync(join(repo, "skills/integrate/templates/project.ts"), join(dir, "project.ts"));
    cpSync(join(repo, "skills/integrate/templates/devtools.tsx"), join(dir, "devtools.tsx"));
    const tsc = join(repo, "node_modules/.bin/tsc");
    expect(() => execFileSync(tsc, ["-p", project], { encoding: "utf8" })).not.toThrow();
  });

  it("refuses to overwrite a folder it did not create", () => {
    const foreign = join(project, "foreign");
    mkdirSync(join(foreign, "src/prototype-controller/lib"), { recursive: true });
    expect(() => execFileSync("node", [script, foreign], { stdio: "pipe" })).toThrow(/not created by prototype-controller/);
  });
});
