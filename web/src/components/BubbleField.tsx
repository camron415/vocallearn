"use client";

import { type CSSProperties } from "react";
import { WaterCapsule } from "@/components/WaterCapsule";
import { CHIP_LABEL_MAX } from "@/lib/suggest-chips";
import { chipTitle } from "@/lib/constants";

/* Anchored constellation around the hero. Slots are fixed: nothing wanders.
   Percentages are of the recents field, which is wider than the 1160 stage
   so the pills sit in the side gutters instead of crowding the composer. */
const SLOTS: CSSProperties[] = [
  { top: "16%", left: "3.5%" },
  { top: "18%", right: "3%" },
  { top: "40%", left: "1%" },
  { top: "45%", right: "1%" },
  { top: "71%", left: "5.5%" },
  { top: "75%", right: "5%" },
];

export type BubbleItem = { id: string; title: string; prompt: string };

export function BubbleField({
  items,
  onSelect,
}: {
  items: BubbleItem[];
  onSelect: (item: BubbleItem, el: HTMLButtonElement | null) => void;
}) {
  if (!items.length) return null;

  return (
    <div className="recents" aria-label="Suggested questions">
      {items.slice(0, 6).map((item, i) => (
        <div key={item.id} className="recent-slot" data-slot={i === 2 || i === 3 ? "side" : "corner"} style={SLOTS[i]}>
          <WaterCapsule
            phase={i}
            title={item.title}
            style={{ "--enter-delay": `${140 + i * 70}ms` } as CSSProperties}
            onClick={(el) => onSelect(item, el)}
          >
            {chipTitle(item.title, CHIP_LABEL_MAX)}
          </WaterCapsule>
        </div>
      ))}
    </div>
  );
}
