import { z } from "zod";

/** Scenario document format version. Older/newer versions are rejected, not migrated, in v0.1. */
export const SCENARIO_SCHEMA_VERSION = 1;

const Id = z
  .string()
  .regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, "use lowercase segments separated by '.' or '-'");

/** Semantic prototype events. Closed set in v0.1; no raw DOM selectors. */
export const ScenarioEventType = z.enum(["SELECT_FILES", "UPLOAD_SETTLED", "RETRY_FAILED_FILE", "RETRY_SETTLED"]);

/** Closed set of guards evaluated against simulated file statuses. */
export const StepGuard = z.enum(["some-failed", "none-failed"]);

export const MockOutcome = z.enum(["success", "error"]);

/** `auto` settles after a fixed delay; `manual` waits for an explicit settle (controllable loading). */
export const Settle = z.discriminatedUnion("mode", [
  z.strictObject({ mode: z.literal("auto"), delayMs: z.int().min(0).max(60_000) }),
  z.strictObject({ mode: z.literal("manual") }),
]);

/**
 * mock-upload: files selected in this step get outcomes by selection order (missing → success).
 * mock-retry: failed files being retried get outcomes in list order (missing → success).
 */
export const ScenarioEffect = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("mock-upload"), outcomes: z.array(MockOutcome).min(1), settle: Settle }),
  z.strictObject({ kind: z.literal("mock-retry"), outcomes: z.array(MockOutcome).min(1), settle: Settle }),
]);

const effectForEvent = {
  SELECT_FILES: "mock-upload",
  RETRY_FAILED_FILE: "mock-retry",
} as const;

export const ScenarioStep = z.strictObject({
  on: ScenarioEventType,
  from: Id,
  to: Id,
  guard: StepGuard.optional(),
  effects: z.array(ScenarioEffect).max(1).default([]),
});

export const ScenarioScope = z.enum(["component", "page", "flow", "cross-flow"]);

export const Scenario = z
  .strictObject({
    schemaVersion: z.literal(SCENARIO_SCHEMA_VERSION, {
      error: (issue) => `unsupported schemaVersion ${JSON.stringify(issue.input)}; expected ${SCENARIO_SCHEMA_VERSION}`,
    }),
    id: Id,
    title: z.string().min(1),
    scope: ScenarioScope,
    flowIds: z.array(Id),
    targets: z.array(Id).min(1),
    initial: Id,
    /** phase id → (target id → state id) shown while in that phase. */
    phases: z.record(Id, z.record(Id, Id)),
    steps: z.array(ScenarioStep).min(1),
  })
  .superRefine((s, ctx) => {
    const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });
    const targets = new Set(s.targets);
    const phases = new Set(Object.keys(s.phases));

    if (!phases.has(s.initial)) issue(["initial"], `unknown phase '${s.initial}'`);
    for (const [phase, map] of Object.entries(s.phases)) {
      for (const target of Object.keys(map)) {
        if (!targets.has(target)) issue(["phases", phase, target], `target '${target}' is not listed in targets`);
      }
    }

    s.steps.forEach((step, i) => {
      if (!phases.has(step.from)) issue(["steps", i, "from"], `unknown phase '${step.from}'`);
      if (!phases.has(step.to)) issue(["steps", i, "to"], `unknown phase '${step.to}'`);
      const required = effectForEvent[step.on as keyof typeof effectForEvent];
      const kinds = step.effects.map((e) => e.kind);
      if (required && !kinds.includes(required)) {
        issue(["steps", i, "effects"], `${step.on} steps need a ${required} effect`);
      }
      if (!required && kinds.length > 0) issue(["steps", i, "effects"], `${step.on} steps take no effects`);
      if (required && kinds.some((k) => k !== required)) {
        issue(["steps", i, "effects"], `${step.on} steps only take a ${required} effect`);
      }
    });
  });

export type ScenarioEventType = z.infer<typeof ScenarioEventType>;
export type StepGuard = z.infer<typeof StepGuard>;
export type MockOutcome = z.infer<typeof MockOutcome>;
export type Settle = z.infer<typeof Settle>;
export type ScenarioEffect = z.infer<typeof ScenarioEffect>;
export type ScenarioStep = z.infer<typeof ScenarioStep>;
export type ScenarioScope = z.infer<typeof ScenarioScope>;
export type Scenario = z.infer<typeof Scenario>;
