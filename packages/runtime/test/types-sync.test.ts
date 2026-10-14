import { describe, expect, it } from "vitest";
import type * as Schema from "@prototype-controller/schema";
import type * as Runtime from "../src/index.ts";

// Compile-time check (enforced by `npm run typecheck`): the runtime's plain types and the
// zod-inferred schema types must be mutually assignable, so copied runtimes stay in sync.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const checks: [
  Same<Runtime.Scenario, Schema.Scenario>,
  Same<Runtime.StateBinding, Schema.StateBinding>,
  Same<Runtime.BindingsDocument, Schema.BindingsDocument>,
  Same<Runtime.Presentation, Schema.Presentation>,
] = [true, true, true, true];

describe("runtime types", () => {
  it("match the validation schema (see typecheck)", () => {
    expect(checks).toEqual([true, true, true, true]);
  });
});
