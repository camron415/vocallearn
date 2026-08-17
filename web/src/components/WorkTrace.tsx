"use client";

import { ThinkingDots } from "@/components/Glass";

export type WorkKind = "searching" | "reading" | "thinking";

export type WorkStep = {
  id: string;
  kind: WorkKind;
  detail?: string;
};

function labelFor(step: WorkStep): string {
  if (step.kind === "searching") {
    return step.detail ? `Searching “${step.detail}”` : "Searching the web";
  }
  if (step.kind === "reading") {
    return step.detail ? `Reading ${step.detail}` : "Reading a source";
  }
  return "Thinking";
}

export function WorkTrace({
  steps,
  thinking,
  collapsed,
  waiting,
}: {
  steps: WorkStep[];
  thinking: string;
  collapsed: boolean;
  waiting: boolean;
}) {
  const searched = steps.some((s) => s.kind === "searching" || s.kind === "reading");
  const thought = thinking.trim().length > 0;

  if (collapsed) {
    if (!searched && !thought) return null;
    return (
      <p className="work-summary">
        {searched && thought
          ? "Searched the web · thought it through"
          : searched
            ? "Searched the web"
            : "Thought it through"}
      </p>
    );
  }

  if (!waiting && steps.length === 0 && !thought) return null;

  return (
    <div className="work-trace">
      {waiting || steps.length > 0 ? <ThinkingDots /> : null}
      {steps.length > 0 ? (
        <ul className="work-steps">
          {steps.map((step) => (
            <li key={step.id}>{labelFor(step)}</li>
          ))}
        </ul>
      ) : waiting ? (
        <p className="work-waiting">Working…</p>
      ) : null}
      {thought ? (
        <div className="work-thinking">
          <p className="work-thinking-label">Thinking</p>
          <p className="work-thinking-text">{thinking.trim()}</p>
        </div>
      ) : null}
    </div>
  );
}
