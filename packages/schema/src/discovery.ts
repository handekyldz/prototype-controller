import { z } from "zod";

/** Discovery document format version. Bump on breaking changes. */
export const DISCOVERY_SCHEMA_VERSION = 1;

/** Semantic id, e.g. `upload.file-list` or `partial-failure`. Not a CSS selector. */
const Id = z
  .string()
  .regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, "use lowercase segments separated by '.' or '-'");

/** Pointer to real project source. `symbol` is text that must appear on `line`. */
export const Evidence = z.strictObject({
  file: z.string().min(1).refine((f) => !f.startsWith("/") && !f.includes(".."), {
    message: "file must be a project-relative path",
  }),
  line: z.int().min(1),
  symbol: z.string().min(1),
});

/**
 * observed: code or project docs directly support the claim.
 * inferred: plausible from task/data dependencies; not implemented.
 * confirmed: the designer explicitly accepted it.
 */
export const FindingStatus = z.enum(["observed", "inferred", "confirmed"]);

/** Certainty of the interpretation, not likelihood of occurrence. */
export const Confidence = z.enum(["high", "medium", "low"]);

export const DiscoveryDimension = z.enum([
  "data",
  "network",
  "user-action",
  "auth",
  "concurrency",
  "presentation",
  "recovery",
]);

const findingFields = {
  id: Id,
  summary: z.string().min(1),
  status: FindingStatus,
  confidence: Confidence,
  evidence: z.array(Evidence),
  /** Why an inferred finding is plausible. Required when status is `inferred`. */
  rationale: z.string().min(1).optional(),
};

function checkFinding(f: { status: string; evidence: unknown[]; rationale?: string }, ctx: z.RefinementCtx) {
  if (f.status === "observed" && f.evidence.length === 0) {
    ctx.addIssue({ code: "custom", path: ["evidence"], message: "observed findings need evidence" });
  }
  if (f.status === "inferred" && !f.rationale) {
    ctx.addIssue({ code: "custom", path: ["rationale"], message: "inferred findings need a rationale" });
  }
}

export const Target = z.strictObject(findingFields).superRefine(checkFinding);

export const ObservedState = z
  .strictObject({ ...findingFields, targetId: Id })
  .superRefine(checkFinding);

export const EdgeCase = z
  .strictObject({ ...findingFields, dimension: DiscoveryDimension, targetIds: z.array(Id).min(1) })
  .superRefine(checkFinding);

export const Question = z.strictObject({
  id: Id,
  question: z.string().min(1),
  recommendedDefault: z.string().min(1),
  consequence: z.string().min(1),
  relatedIds: z.array(Id),
  /** Set once the designer answers; answered questions must not be asked again. */
  answer: z.string().min(1).optional(),
});

/** Something searched for and not found (missing implementation, not an unknown decision). */
export const NotFound = z.strictObject({
  id: Id,
  summary: z.string().min(1),
  searched: z.array(z.string().min(1)).min(1),
});

export const Flow = z
  .strictObject({
    ...findingFields,
    targets: z.array(Target).min(1),
    states: z.array(ObservedState),
    edgeCases: z.array(EdgeCase),
    questions: z.array(Question),
    notFound: z.array(NotFound),
  })
  .superRefine((flow, ctx) => {
    checkFinding(flow, ctx);

    const ids = new Set<string>([flow.id]);
    const groups = ["targets", "states", "edgeCases", "questions", "notFound"] as const;
    for (const group of groups) {
      flow[group].forEach((item, i) => {
        if (ids.has(item.id)) {
          ctx.addIssue({ code: "custom", path: [group, i, "id"], message: `duplicate id '${item.id}'` });
        }
        ids.add(item.id);
      });
    }

    const targetIds = new Set(flow.targets.map((t) => t.id));
    flow.states.forEach((s, i) => {
      if (!targetIds.has(s.targetId)) {
        ctx.addIssue({ code: "custom", path: ["states", i, "targetId"], message: `unknown target '${s.targetId}'` });
      }
    });
    flow.edgeCases.forEach((e, i) => {
      e.targetIds.forEach((t, j) => {
        if (!targetIds.has(t)) {
          ctx.addIssue({ code: "custom", path: ["edgeCases", i, "targetIds", j], message: `unknown target '${t}'` });
        }
      });
    });
    flow.questions.forEach((q, i) => {
      q.relatedIds.forEach((r, j) => {
        if (!ids.has(r)) {
          ctx.addIssue({ code: "custom", path: ["questions", i, "relatedIds", j], message: `unknown id '${r}'` });
        }
      });
    });
  });

export const DiscoveryResult = z.strictObject({
  schemaVersion: z.literal(DISCOVERY_SCHEMA_VERSION),
  project: z.strictObject({
    name: z.string().min(1),
    framework: z.string().min(1),
  }),
  flows: z.array(Flow).min(1),
});

export type Evidence = z.infer<typeof Evidence>;
export type FindingStatus = z.infer<typeof FindingStatus>;
export type Confidence = z.infer<typeof Confidence>;
export type DiscoveryDimension = z.infer<typeof DiscoveryDimension>;
export type Target = z.infer<typeof Target>;
export type ObservedState = z.infer<typeof ObservedState>;
export type EdgeCase = z.infer<typeof EdgeCase>;
export type Question = z.infer<typeof Question>;
export type NotFound = z.infer<typeof NotFound>;
export type Flow = z.infer<typeof Flow>;
export type DiscoveryResult = z.infer<typeof DiscoveryResult>;

/** Collect every evidence pointer in a result, for path/line verification. */
export function collectEvidence(result: DiscoveryResult): Evidence[] {
  return result.flows.flatMap((flow) => [
    ...flow.evidence,
    ...flow.targets.flatMap((t) => t.evidence),
    ...flow.states.flatMap((s) => s.evidence),
    ...flow.edgeCases.flatMap((e) => e.evidence),
  ]);
}
