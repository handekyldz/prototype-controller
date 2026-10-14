import { z } from "zod";

/** Presentation document format version. */
export const PRESENTATION_SCHEMA_VERSION = 1;

const Id = z
  .string()
  .regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, "use lowercase segments separated by '.' or '-'");

/**
 * What advancing to a step does:
 * - select-files / settle: the controller performs it (sample files, no OS dialog).
 * - await-prototype: the presenter performs it in the prototype itself (e.g. the real
 *   Retry button); the step completes when the runtime reaches `expectPhase`.
 */
export const PresentationAction = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("select-files"),
    files: z.array(z.strictObject({ name: z.string().min(1), sizeKb: z.int().min(0) })).min(1),
  }),
  z.strictObject({ type: z.literal("settle") }),
  z.strictObject({
    type: z.literal("await-prototype"),
    event: z.literal("RETRY_FAILED_FILE"),
    hint: z.string().min(1),
  }),
]);

export const PresentationStep = z.strictObject({
  title: z.string().min(1),
  note: z.string().min(1).optional(),
  action: PresentationAction,
  /** Phase the scenario must be in after this step. */
  expectPhase: Id,
});

export const Presentation = z.strictObject({
  schemaVersion: z.literal(PRESENTATION_SCHEMA_VERSION),
  id: Id,
  title: z.string().min(1),
  scenarioId: Id,
  /** Shown for step 0, right after the scenario is activated. */
  intro: z.string().min(1),
  steps: z.array(PresentationStep).min(1),
});

export type PresentationAction = z.infer<typeof PresentationAction>;
export type PresentationStep = z.infer<typeof PresentationStep>;
export type Presentation = z.infer<typeof Presentation>;
