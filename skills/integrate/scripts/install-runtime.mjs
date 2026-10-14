#!/usr/bin/env node
// Copies the prototype-controller runtime, React hooks and panel into a prototype
// project as plain source files (no npm package, no dependencies besides React).
// Usage: node install-runtime.mjs <projectDir> [destRelativeToProject]
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const [projectArg, destArg = "src/prototype-controller/lib"] = process.argv.slice(2);
if (!projectArg) {
  console.error("usage: install-runtime.mjs <projectDir> [dest]");
  process.exit(2);
}
const projectDir = resolve(projectArg);
const dest = resolve(projectDir, destArg);
if (!dest.startsWith(projectDir + "/")) {
  console.error(`refusing to write outside the project: ${dest}`);
  process.exit(2);
}

const MARKER = "VERSION";
if (existsSync(dest) && !existsSync(join(dest, MARKER))) {
  console.error(`refusing to overwrite ${relative(projectDir, dest)}: it was not created by prototype-controller`);
  process.exit(1);
}

const version = JSON.parse(readFileSync(join(pluginRoot, ".claude-plugin/plugin.json"), "utf8")).version;

/** [source relative to plugin root, destination relative to lib] */
const files = [
  ["packages/runtime/src/types.ts", "runtime/types.ts"],
  ["packages/runtime/src/reducer.ts", "runtime/reducer.ts"],
  ["packages/runtime/src/controller.ts", "runtime/controller.ts"],
  ["packages/runtime/src/index.ts", "runtime/index.ts"],
  ["packages/react/src/index.tsx", "react/index.tsx"],
  ["packages/react/src/panel/ControllerPanel.tsx", "react/panel/ControllerPanel.tsx"],
  ["packages/react/src/panel/present.ts", "react/panel/present.ts"],
  ["packages/react/src/panel/index.ts", "react/panel/index.ts"],
  ["packages/react/src/panel/panel.css", "react/panel/panel.css"],
];

const header = `// Copied by prototype-controller ${version}. Do not edit: re-run the integrate skill to update.\n`;

function rewrite(source, destRel) {
  const runtimeIndex = relative(dirname(join(dest, destRel)), join(dest, "runtime/index"));
  const runtimeImport = runtimeIndex.startsWith(".") ? runtimeIndex : `./${runtimeIndex}`;
  return (
    header +
    source
      .replaceAll('"@prototype-controller/runtime"', JSON.stringify(runtimeImport))
      // Extensionless relative imports work with any bundler-style tsconfig.
      .replace(/(from\s+"\.{1,2}\/[^"]+?)\.tsx?"/g, '$1"')
  );
}

rmSync(dest, { recursive: true, force: true });
for (const [from, to] of files) {
  const target = join(dest, to);
  mkdirSync(dirname(target), { recursive: true });
  if (to.endsWith(".css")) {
    cpSync(join(pluginRoot, from), target);
  } else {
    writeFileSync(target, rewrite(readFileSync(join(pluginRoot, from), "utf8"), to));
  }
}
writeFileSync(join(dest, MARKER), `${version}\n`);
console.log(`prototype-controller ${version} runtime copied to ${relative(projectDir, dest)} (${files.length} files)`);
