import { z } from "zod";

/** Bindings document format version. Bump on breaking changes. */
export const BINDINGS_SCHEMA_VERSION = 1;

const Id = z
  .string()
  .regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, "use lowercase segments separated by '.' or '-'");

/** Build-time registry key of a compiled component, e.g. `UploadPartialError`. */
const ComponentKey = z.string().regex(/^[A-Z][A-Za-z0-9]*$/, "componentKey must be a PascalCase registry key");

const ProjectPath = z.string().min(1).refine((f) => !f.startsWith("/") && !f.includes(".."), {
  message: "path must be project-relative",
});

/** Designer intent for a single target/state. */
export const BindingMode = z.enum(["generate", "use-existing", "provide-later"]);
/** Where the implementation came from. */
export const BindingOrigin = z.enum(["generated", "existing-component", "design-reference", "pending"]);
/** Who may authorize visual changes. */
export const BindingOwner = z.enum(["designer", "controller"]);
export const BindingStatus = z.enum(["ready", "needs-review", "unmapped"]);

/**
 * Designer-supplied reference (screenshot or written description), stored as a
 * project-relative file. `accepted` flips to true only when the designer approves
 * the generated implementation; fidelity to a screenshot is never assumed.
 */
export const DesignReference = z.strictObject({
  kind: z.enum(["screenshot", "text"]),
  path: ProjectPath,
  accepted: z.boolean(),
});

export const StateBinding = z
  .strictObject({
    targetId: Id,
    stateId: Id,
    mode: BindingMode,
    origin: BindingOrigin,
    owner: BindingOwner,
    status: BindingStatus,
    visualLocked: z.boolean(),
    componentKey: ComponentKey.optional(),
    reference: DesignReference.optional(),
    /** Why the state cannot run yet. Required when `unmapped`. */
    reason: z.string().min(1).optional(),
  })
  .superRefine((b, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });

    if (b.mode === "use-existing") {
      if (b.origin !== "existing-component") issue("origin", "use-existing requires origin existing-component");
      if (b.owner !== "designer") issue("owner", "existing components are designer-owned");
      if (!b.visualLocked) issue("visualLocked", "existing components must be visually locked");
    }
    if (b.mode === "generate" && b.origin !== "generated" && b.origin !== "design-reference") {
      issue("origin", "generate requires origin generated or design-reference");
    }
    if (b.mode === "provide-later") {
      if (b.origin !== "pending") issue("origin", "provide-later requires origin pending");
      if (b.status !== "unmapped") issue("status", "provide-later states stay unmapped");
      if (b.componentKey) issue("componentKey", "pending states have no component");
    }

    if (b.origin === "design-reference") {
      if (!b.reference) issue("reference", "design-reference requires a reference");
      if (b.owner !== "designer") issue("owner", "reference-based states are designer-owned");
      if (b.status === "ready" && !b.reference?.accepted) {
        issue("status", "reference-based states stay needs-review until the designer accepts them");
      }
    } else if (b.reference) {
      issue("reference", "only design-reference states carry a reference");
    }

    if (b.status !== "unmapped" && !b.componentKey) issue("componentKey", `${b.status} states need a componentKey`);
    if (b.status === "unmapped" && !b.reason) issue("reason", "unmapped states need a reason");
  });

export const BindingsDocument = z
  .strictObject({
    schemaVersion: z.literal(BINDINGS_SCHEMA_VERSION),
    bindings: z.array(StateBinding),
  })
  .superRefine((doc, ctx) => {
    const seen = new Set<string>();
    doc.bindings.forEach((b, i) => {
      const key = `${b.targetId}/${b.stateId}`;
      if (seen.has(key)) ctx.addIssue({ code: "custom", path: ["bindings", i], message: `duplicate binding '${key}'` });
      seen.add(key);
    });
  });

export type BindingMode = z.infer<typeof BindingMode>;
export type BindingOrigin = z.infer<typeof BindingOrigin>;
export type BindingOwner = z.infer<typeof BindingOwner>;
export type BindingStatus = z.infer<typeof BindingStatus>;
export type DesignReference = z.infer<typeof DesignReference>;
export type StateBinding = z.infer<typeof StateBinding>;
export type BindingsDocument = z.infer<typeof BindingsDocument>;

/**
 * Check bindings against the project's compiled component registry.
 * Returns human-readable problems; empty means every componentKey resolves.
 */
export function checkRegistry(doc: BindingsDocument, registryKeys: readonly string[]): string[] {
  const keys = new Set(registryKeys);
  return doc.bindings
    .filter((b) => b.componentKey && !keys.has(b.componentKey))
    .map((b) => `${b.targetId}/${b.stateId}: componentKey '${b.componentKey}' is not in the registry`);
}
