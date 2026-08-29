"use client";

import { type CSSProperties, useEffect, useState } from "react";
import { WaterCapsule } from "@/components/WaterCapsule";
import { KIND_LABEL, type HarvestChip } from "@/lib/harvest";
import { readKeepChips, seedKeepDemo, subscribeKeep } from "@/lib/keep-memory";

const SLOTS: CSSProperties[] = [
  { top: "16%", left: "3.5%" },
  { top: "18%", right: "3%" },
  { top: "40%", left: "1%" },
  { top: "45%", right: "1%" },
  { top: "71%", left: "5.5%" },
  { top: "75%", right: "5%" },
];

export function KeepAlbum({ demo = false }: { demo?: boolean }) {
  const [chips, setChips] = useState<HarvestChip[]>(() => readKeepChips());

  useEffect(() => {
    if (demo) seedKeepDemo();
    setChips(readKeepChips());
    return subscribeKeep(() => setChips(readKeepChips()));
  }, [demo]);

  if (!chips.length) return null;

  return (
    <div className="recents keep-album" aria-label="Keep">
      {chips.slice(0, 6).map((chip, i) => (
        <div
          key={chip.id}
          className="recent-slot keep-album__slot"
          style={
            {
              ...SLOTS[i],
              "--keep-delay": `${i * 0.55}s`,
            } as CSSProperties
          }
        >
          <WaterCapsule
            kind={chip.kind}
            className="capsule--keep-album"
            phase={i}
            title={`${KIND_LABEL[chip.kind]} · ${chip.token}`}
            style={{ "--enter-delay": `${120 + i * 90}ms` } as CSSProperties}
            onClick={() => window.dispatchEvent(new Event("halo-learn-open"))}
          >
            {chip.token}
          </WaterCapsule>
        </div>
      ))}
    </div>
  );
}
