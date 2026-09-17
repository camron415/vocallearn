"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { KIND_LABEL, type HarvestChip } from "@/lib/harvest";
import {
  isBankedChip,
  isMasteredChip,
  keepRank,
  readLoopStats,
} from "@/lib/keep-memory";
import { HALO_BEAD_INSPECT, HALO_GOLD_INSPECT } from "@/lib/keep-inspect";

function isGoldChip(chip: HarvestChip) {
  return isMasteredChip(chip) || keepRank(chip) >= 3;
}

export function GoldKeptBadge({ chips }: { chips: HarvestChip[] }) {
  const gold = chips.filter(isGoldChip);
  const n = gold.length;
  const inProgress = chips.filter(
    (chip) => isBankedChip(chip) && keepRank(chip) < 3
  ).length;
  const [rounds, setRounds] = useState(0);
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [panelTop, setPanelTop] = useState(72);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setRounds(readLoopStats().roundsLifetime ?? 0);
  }, [open]);

  useEffect(() => {
    function onPulse() {
      setPulse(true);
      window.setTimeout(() => setPulse(false), 520);
    }
    function onBeadInspect() {
      setOpen(false);
    }
    window.addEventListener("halo-gold-pulse", onPulse);
    window.addEventListener(HALO_BEAD_INSPECT, onBeadInspect);
    return () => {
      window.removeEventListener("halo-gold-pulse", onPulse);
      window.removeEventListener(HALO_BEAD_INSPECT, onBeadInspect);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    window.dispatchEvent(new Event(HALO_GOLD_INSPECT));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onCoveHome() {
      setOpen(false);
    }
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    const listen = window.setTimeout(() => {
      window.addEventListener("pointerdown", onPointer);
    }, 400);
    window.addEventListener("keydown", onKey);
    window.addEventListener("halo-cove-home", onCoveHome);
    return () => {
      window.clearTimeout(listen);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("halo-cove-home", onCoveHome);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const box = rootRef.current?.getBoundingClientRect();
    if (box) setPanelTop(Math.round(box.bottom + 8));
  }, [open]);

  return (
    <div className="gold-kept" ref={rootRef}>
      <button
        type="button"
        className={`gold-kept-badge${n ? "" : " is-empty"}${pulse ? " is-pulse" : ""}`}
        data-gold-kept-land=""
        aria-expanded={open}
        aria-label={n ? `Kept, ${n} mastered` : "Kept, none mastered yet"}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <span className="gold-kept-ring" aria-hidden>
          ◎
        </span>
        {n ? (
          <span className="gold-kept-n" aria-hidden>
            {n}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          className="gold-kept-panel"
          role="dialog"
          aria-label="Kept"
          style={{ "--kept-panel-top": `${panelTop}px` } as CSSProperties}
        >
          <p className="gold-kept-head">Kept</p>
          <p className="gold-kept-summary">
            {n} mastered · {rounds} rounds · {inProgress} in progress
          </p>
          <div className="gold-kept-list">
            {gold.map((chip) => (
              <div key={chip.id} className="gold-kept-row">
                <span className="gold-kept-prompt">{chip.prompt}</span>
                <span className="gold-kept-meta">
                  {chip.answer} · {KIND_LABEL[chip.kind]}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
