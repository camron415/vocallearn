"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { KIND_LABEL, type HarvestChip } from "@/lib/harvest";
import {
  isBankedChip,
  keepRank,
  sortKeepBeads,
} from "@/lib/keep-memory";
import { harvestStyleFromDom } from "@/lib/harvest-style";
import { keepSlotRem } from "@/lib/keep-land";
import {
  keepHexPair,
  homeStyleFromDom,
  type HomeInk,
} from "@/lib/home-style";

const GOLD_FADE_MS = 260;

function inProgressBeads(chips: HarvestChip[]) {
  return sortKeepBeads(chips).filter((chip) => keepRank(chip) < 3);
}

export function KeepPocket({
  chips,
  pocketRef,
}: {
  chips: HarvestChip[];
  pocketRef?: (el: HTMLDivElement | null) => void;
}) {
  const facts = chips.filter((chip) => isBankedChip(chip) && keepRank(chip) < 3);
  const style = harvestStyleFromDom();
  const dock = style.dock;
  const live = inProgressBeads(chips);
  const [fading, setFading] = useState<HarvestChip[]>([]);
  const liveKey = live.map((chip) => chip.id).join(",");
  const prevKey = useRef(liveKey);
  const orderRef = useRef<string[]>(live.map((chip) => chip.id));

  const byId = new Map<string, HarvestChip>();
  for (const chip of [...live, ...fading]) byId.set(chip.id, chip);
  const ids = orderRef.current.filter((id) => byId.has(id));
  for (const chip of live) {
    if (!ids.includes(chip.id)) ids.push(chip.id);
  }
  orderRef.current = ids;
  const beads = ids.map((id) => byId.get(id)!);

  const empty =
    ((!facts.length && !beads.length) || dock === "absorb") && !fading.length;
  const newestAt = live.reduce((max, chip) => Math.max(max, chip.keptAt ?? 0), 0);
  const rankName = ["new", "bronze", "silver", "gold"] as const;
  const [ink, setInk] = useState<HomeInk>("citrus");
  const [dark, setDark] = useState(false);
  const [slot, setSlot] = useState("1.02rem");
  const dockRef = useRef<HTMLDivElement>(null);
  const [clipped, setClipped] = useState(false);

  useEffect(() => {
    const prev = prevKey.current.split(",").filter(Boolean);
    const now = new Set(live.map((chip) => chip.id));
    const gone = prev.filter((id) => !now.has(id));
    prevKey.current = liveKey;
    if (!gone.length) return;
    const leaving = chips.filter(
      (chip) => gone.includes(chip.id) && keepRank(chip) >= 3
    );
    if (!leaving.length) return;
    setFading((list) => [
      ...list.filter((chip) => !gone.includes(chip.id)),
      ...leaving,
    ]);
    const timer = window.setTimeout(() => {
      setFading((list) => list.filter((chip) => !gone.includes(chip.id)));
    }, GOLD_FADE_MS);
    return () => window.clearTimeout(timer);
  }, [liveKey, chips]);

  useLayoutEffect(() => {
    function fit() {
      setSlot(keepSlotRem(beads.length, window.innerWidth));
    }
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [beads.length]);

  useLayoutEffect(() => {
    const el = dockRef.current;
    if (!el) {
      setClipped(false);
      return;
    }
    const dock = el;
    function measure() {
      setClipped(dock.scrollWidth > dock.clientWidth + 1);
    }
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(el);
    return () => watch.disconnect();
  }, [beads.length, slot]);

  useEffect(() => {
    function sync() {
      setInk(homeStyleFromDom().ink);
      setDark(document.documentElement.dataset.haloTheme === "dark");
    }
    sync();
    window.addEventListener("halo-home-style", sync);
    const watch = new MutationObserver(sync);
    watch.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-home-ink", "data-home-skin", "data-halo-theme"],
    });
    return () => {
      window.removeEventListener("halo-home-style", sync);
      watch.disconnect();
    };
  }, []);

  return (
    <div
      className={`keep-pocket keep-pocket--${dock}${empty ? " is-empty" : ""}`}
      ref={pocketRef}
      data-keep-pocket="true"
      aria-label={
        facts.length
          ? `Keep, ${facts.length} in progress`
          : "Keep"
      }
    >
      {empty ? (
        <span className="keep-land" data-keep-land="" aria-hidden />
      ) : dock === "count" ? (
        <div className="keep-dock keep-dock--count" title="Keep">
          {facts.length}
          <span className="keep-land" data-keep-land="" aria-hidden />
        </div>
      ) : dock === "beads" ? (
        <div
          ref={dockRef}
          className={`keep-dock keep-dock--beads${clipped ? " is-clipped" : ""}`}
          title="Keep"
          style={
            {
              "--keep-n": String(Math.max(1, beads.length)),
              "--keep-slot": slot,
            } as CSSProperties
          }
        >
          {beads.map((chip, i) => {
            const rank = keepRank(chip);
            const band =
              i > 0 && keepRank(beads[i - 1]) !== rank ? " keep-bead--band" : "";
            const newest =
              (chip.keptAt ?? 0) === newestAt && newestAt > 0 ? " is-newest" : "";
            const leaving = fading.some((item) => item.id === chip.id)
              ? " is-leaving-gold"
              : "";
            return (
            <span
              key={chip.id}
              className={`keep-bead keep-bead--dock keep-bead--${chip.kind} keep-bead--rank-${rank}${band}${newest}${leaving}`}
              title={`${KIND_LABEL[chip.kind]} · ${chip.token} · ${rankName[Math.min(rank, 2)]}`}
              style={{ background: keepHexPair(ink, chip.kind, dark).lo }}
            />
            );
          })}
          <span className="keep-land" data-keep-land="" aria-hidden />
        </div>
      ) : (
        <div className="keep-dock keep-dock--words" title="Keep">
          {facts.slice(-2).map((chip) => (
            <span
              key={chip.id}
              className={`keep-word keep-word--${chip.kind}`}
              title={`${KIND_LABEL[chip.kind]} · ${chip.token}`}
            >
              {chip.token}
            </span>
          ))}
          <span className="keep-land" data-keep-land="" aria-hidden />
        </div>
      )}
    </div>
  );
}
