"use client";

import { useState } from "react";
import { finishAppTour } from "@/lib/app-tour";

const SLIDES = [
  {
    kicker: "Ask",
    title: "Ask like you would a friend",
    body: "You get a clear answer right away. No lesson until something is worth keeping.",
  },
  {
    kicker: "Keep",
    title: "Facts become beads",
    body: "If it’s worth remembering, it flies to Keep — a quiet tray of what you’re still learning.",
  },
  {
    kicker: "Home",
    title: "When it’s due, say it",
    body: "Tap a chip. See it, then say it. That’s how it becomes yours.",
  },
] as const;

export function AppFirstRun({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const last = i === SLIDES.length - 1;

  function close() {
    finishAppTour();
    onDone();
  }

  return (
    <div className="login-stage app-first-run">
      <div className="login-card auth-card app-first-run-card">
        <p className="app-first-run-kicker">{slide.kicker}</p>
        <h1 className="login-title">{slide.title}</h1>
        <p className="login-sub">{slide.body}</p>
        <div className="app-first-run-dots" aria-hidden>
          {SLIDES.map((row, n) => (
            <span
              key={row.kicker}
              className={n === i ? "is-on" : undefined}
            />
          ))}
        </div>
        <button type="button" className="stone-btn login-submit" onClick={last ? close : () => setI(i + 1)}>
          {last ? "Continue" : "Next"}
        </button>
        <button type="button" className="login-text-btn" onClick={close}>
          Skip
        </button>
      </div>
    </div>
  );
}
