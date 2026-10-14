import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import type { Presentation, ScenarioScope } from "@prototype-controller/schema";
import type { Controller } from "@prototype-controller/runtime";
import { replay, runStep } from "./present.ts";
import "./panel.css";

export type ControllerPanelProps = {
  controller: Controller;
  /** Flow titles, e.g. from discovery. Flows without a title fall back to their id. */
  flows?: { id: string; title: string }[];
  presentations?: Presentation[];
  defaultOpen?: boolean;
};

type Mode = "explore" | "present";
const scopes: ScenarioScope[] = ["component", "page", "flow", "cross-flow"];

/** Development-only floating controller. Never mount it in production builds. */
export function ControllerPanel({ controller, flows = [], presentations = [], defaultOpen = false }: ControllerPanelProps) {
  const state = useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
  const [open, setOpen] = useState(defaultOpen);
  const [mode, setMode] = useState<Mode>("explore");
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  if (!controller.enabled) return null;

  function close() {
    setOpen(false);
    toggleRef.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
    }
  }

  return (
    <div className="pc-root">
      <button
        ref={toggleRef}
        type="button"
        className="pc-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        Prototype controller{state.scenario ? " · active" : ""}
      </button>
      {open && (
        <section id={panelId} className="pc-panel" aria-label="Prototype controller" onKeyDown={onKeyDown}>
          <div className="pc-modes" role="group" aria-label="Mode">
            <button type="button" aria-pressed={mode === "explore"} onClick={() => setMode("explore")}>
              Explore
            </button>
            <button type="button" aria-pressed={mode === "present"} onClick={() => setMode("present")}>
              Present
            </button>
          </div>
          {state.error && (
            <p className="pc-error" role="alert">
              {state.error}
            </p>
          )}
          {mode === "explore" ? (
            <Explore controller={controller} flows={flows} />
          ) : (
            <Present controller={controller} presentations={presentations} />
          )}
        </section>
      )}
    </div>
  );
}

function useControllerState(controller: Controller) {
  return useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
}

function Explore({ controller, flows }: { controller: Controller; flows: { id: string; title: string }[] }) {
  const state = useControllerState(controller);
  const flowIds = [...new Set(controller.scenarios.flatMap((s) => s.flowIds))];
  const [flowId, setFlowId] = useState(flowIds[0] ?? "");
  const [scope, setScope] = useState<ScenarioScope | "all">("all");
  const flowTitle = (id: string) => flows.find((f) => f.id === id)?.title ?? id;

  const scenarios = controller.scenarios.filter(
    (s) => (!flowId || s.flowIds.includes(flowId)) && (scope === "all" || s.scope === scope),
  );
  const flowTargets = new Set(
    controller.scenarios.filter((s) => !flowId || s.flowIds.includes(flowId)).flatMap((s) => s.targets),
  );
  const bindings = controller.bindings.filter((b) => flowTargets.has(b.targetId));
  const uploading = state.files.some((f) => f.status === "uploading");
  const override = state.manualOverride;

  return (
    <>
      <div className="pc-filters">
        <label>
          Flow
          <select value={flowId} onChange={(e) => setFlowId(e.target.value)}>
            {flowIds.map((id) => (
              <option key={id} value={id}>
                {flowTitle(id)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Scope
          <select value={scope} onChange={(e) => setScope(e.target.value as ScenarioScope | "all")}>
            <option value="all">All scopes</option>
            {scopes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <h2 className="pc-heading">Scenarios</h2>
      {scenarios.length === 0 ? (
        <p className="pc-muted">No scenarios for this flow and scope.</p>
      ) : (
        <ul className="pc-list">
          {scenarios.map((s) => {
            const check = controller.check(s.id);
            const active = state.scenario?.id === s.id;
            return (
              <li key={s.id} className="pc-item">
                <div className="pc-item-main">
                  <span className="pc-item-title">{s.title}</span>
                  <span className="pc-chip">{s.scope}</span>
                  {active ? (
                    <span className="pc-badge pc-badge--active">Active</span>
                  ) : check.ok ? (
                    <span className="pc-badge pc-badge--ready">Ready</span>
                  ) : (
                    <span className="pc-badge pc-badge--blocked">Blocked</span>
                  )}
                </div>
                {!check.ok && <p className="pc-reason">{check.errors.join("; ")}</p>}
                <button
                  type="button"
                  disabled={!check.ok}
                  aria-label={`${active ? "Restart" : "Activate"} ${s.title}`}
                  onClick={() => controller.activate(s.id)}
                >
                  {active ? "Restart" : "Activate"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="pc-active" aria-live="polite">
        {state.scenario ? (
          <p>
            <strong>{state.scenario.title}</strong> · phase <code>{state.phase}</code>
          </p>
        ) : (
          <p className="pc-muted">No scenario active. The prototype runs as built.</p>
        )}
      </div>
      <div className="pc-actions">
        <button type="button" disabled={!uploading} onClick={() => controller.settle()}>
          Finish uploads
        </button>
        <button type="button" onClick={() => controller.reset()}>
          Reset to baseline
        </button>
      </div>

      <h2 className="pc-heading">States</h2>
      <ul className="pc-list">
        {bindings.map((b) => {
          const previewing = override?.targetId === b.targetId && override.stateId === b.stateId;
          const label = `${b.targetId} / ${b.stateId}`;
          return (
            <li key={label} className="pc-item">
              <div className="pc-item-main">
                <span className="pc-item-title">{label}</span>
                <span className={`pc-badge pc-badge--${b.status}`}>{b.status}</span>
              </div>
              <p className="pc-muted">
                {b.origin} · owner {b.owner}
              </p>
              {b.status === "unmapped" ? (
                <p className="pc-reason">{b.reason}</p>
              ) : (
                <button
                  type="button"
                  aria-pressed={previewing}
                  aria-label={`Preview ${label}`}
                  onClick={() => (previewing ? controller.clearOverride() : controller.setOverride({ targetId: b.targetId, stateId: b.stateId }))}
                >
                  {previewing ? "Stop preview" : "Preview"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {override && (
        <button type="button" onClick={() => controller.clearOverride()}>
          Clear preview ({override.targetId})
        </button>
      )}
    </>
  );
}

function Present({ controller, presentations }: { controller: Controller; presentations: Presentation[] }) {
  const state = useControllerState(controller);
  const [presentationId, setPresentationId] = useState(presentations[0]?.id ?? "");
  const [completed, setCompleted] = useState<number | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const presentation = presentations.find((p) => p.id === presentationId);
  const next = presentation && completed !== null ? presentation.steps[completed] : undefined;
  const waiting = next?.action.type === "await-prototype";
  const interrupted = completed !== null && state.scenario?.id !== presentation?.scenarioId;

  // Advance an await-prototype step once the presenter has acted in the prototype.
  useEffect(() => {
    if (waiting && next && state.phase === next.expectPhase) {
      setCompleted((c) => (c === null ? c : c + 1));
    }
  }, [waiting, next, state.phase]);

  if (!presentation) return <p className="pc-muted">No presentations defined.</p>;

  function goTo(count: number) {
    const result = replay(controller, presentation!, count);
    setProblem(result.ok ? null : result.errors.join("; "));
    setCompleted(count);
  }

  function advance() {
    if (!next || completed === null) return;
    const result = runStep(controller, next, completed);
    setProblem(result.ok ? null : result.errors.join("; "));
    if (result.ok) setCompleted(completed + 1);
  }

  const total = presentation.steps.length;

  return (
    <div className="pc-present">
      {presentations.length > 1 && (
        <label>
          Presentation
          <select
            value={presentationId}
            onChange={(e) => {
              setPresentationId(e.target.value);
              setCompleted(null);
            }}
          >
            {presentations.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <h2 className="pc-heading">{presentation.title}</h2>

      {completed === null ? (
        <button type="button" onClick={() => goTo(0)}>
          Start presentation
        </button>
      ) : (
        <>
          <ol className="pc-steps">
            <li aria-current={completed === 0 ? "step" : undefined}>{presentation.intro}</li>
            {presentation.steps.map((step, i) => (
              <li
                key={step.title}
                className={i < completed ? "pc-step--done" : undefined}
                aria-current={i + 1 === completed ? "step" : undefined}
              >
                {step.title}
                {i + 1 === completed && step.note && <span className="pc-muted"> — {step.note}</span>}
              </li>
            ))}
          </ol>
          <p className="pc-progress" aria-live="polite">
            Step {completed} of {total}
            {waiting && next?.action.type === "await-prototype" && <strong> · {next.action.hint}</strong>}
          </p>
          {(problem || interrupted) && (
            <p className="pc-error" role="alert">
              {problem ?? "The presentation was interrupted. Restart to continue."}
            </p>
          )}
          <div className="pc-actions">
            <button type="button" disabled={completed === 0} onClick={() => goTo(completed - 1)}>
              Previous
            </button>
            <button type="button" disabled={completed >= total || waiting || interrupted} onClick={advance}>
              {next ? `Next: ${next.title}` : "Done"}
            </button>
            <button type="button" onClick={() => goTo(0)}>
              Restart
            </button>
          </div>
        </>
      )}
    </div>
  );
}
