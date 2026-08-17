"use client";

import { FormEvent, useState } from "react";
import { GlassButton } from "@/components/Glass";
import { LengthPicks } from "@/components/LengthPicks";
import { WaterPane } from "@/components/WaterSurface";
import { APP_NAME } from "@/lib/constants";
import type { AnswerLength } from "@/lib/types";

export function WelcomeGate({
  defaultName,
  onDone,
}: {
  defaultName: string;
  onDone: () => void;
}) {
  const [name, setName] = useState(defaultName);
  const [length, setLength] = useState<AnswerLength>("medium");
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: name.trim() || defaultName,
        answerLength: length,
        onboarded: true,
      }),
    });
    setSaving(false);
    onDone();
  }

  return (
    <div className="history-overlay" role="dialog" aria-modal="true">
      <div className="history-page settings-page">
        <h1 className="history-page-title">Welcome to {APP_NAME}</h1>
        <p className="login-sub">Two quick things, then a short tour of Home.</p>
        <form className="settings-block" onSubmit={submit}>
          <label className="field-label" htmlFor="welcome-name">
            What should {APP_NAME} call you?
          </label>
          <WaterPane variant="field" className="settings-name-pane">
            <input
              id="welcome-name"
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              required
            />
          </WaterPane>
          <p className="field-label">How long should answers be?</p>
          <LengthPicks value={length} onChange={setLength} />
          <GlassButton type="submit" disabled={saving}>
            {saving ? "Saving…" : "Continue"}
          </GlassButton>
        </form>
        <GlassButton
          onClick={() => {
            void fetch("/api/profile", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ onboarded: true }),
            }).then(onDone);
          }}
        >
          Skip
        </GlassButton>
      </div>
    </div>
  );
}
