"use client";

import { useEffect, useState } from "react";
import { GlassButton } from "@/components/Glass";

const STEPS = [
  {
    key: "compose",
    title: "This is Ask",
    body: "Type or dictate here. That is how you talk to Cove.",
  },
  {
    key: "bubbles",
    title: "Suggestions",
    body: "These are starter questions. After you use Cove a bit, they shift toward what you actually ask.",
  },
  {
    key: "history",
    title: "History",
    body: "Open past chats from here. Each thread keeps its title.",
  },
  {
    key: "settings",
    title: "Settings",
    body: "Name, answer length, motion, scene, and sign out live here — not in the header row.",
  },
] as const;

export function HomeTour({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<DOMRect | null>(null);
  const [steps, setSteps] = useState<(typeof STEPS)[number][]>([...STEPS]);
  const step = steps[index] ?? STEPS[0];

  useEffect(() => {
    const recents = document.querySelector(".recents");
    if (!recents || getComputedStyle(recents).display === "none") {
      setSteps(STEPS.filter((item) => item.key !== "bubbles"));
    }
  }, []);

  useEffect(() => {
    const el = document.querySelector(`[data-tour="${step.key}"]`);
    setBox(el?.getBoundingClientRect() ?? null);
  }, [step.key]);

  function next() {
    if (index >= steps.length - 1) {
      onDone();
      return;
    }
    setIndex((i) => i + 1);
  }

  return (
    <div className="tour-layer" role="dialog" aria-modal="true">
      {box ? (
        <div
          className="tour-spot"
          style={{
            top: box.top - 8,
            left: box.left - 8,
            width: box.width + 16,
            height: box.height + 16,
          }}
        />
      ) : null}
      <div className="tour-card">
        <p className="tour-kicker">
          {index + 1} of {steps.length}
        </p>
        <h2>{step.title}</h2>
        <p>{step.body}</p>
        <div className="settings-row">
          <GlassButton onClick={onDone}>Skip</GlassButton>
          <GlassButton onClick={next}>
            {index === steps.length - 1 ? "Done" : "Next"}
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
