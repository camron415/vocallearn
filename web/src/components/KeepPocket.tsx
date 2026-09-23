"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { KIND_LABEL, type HarvestChip } from "@/lib/harvest";
import {
  isBankedChip,
  isDueChip,
  KEEP_CAP,
  keepInspectView,
  keepRank,
  sortKeepBeads,
} from "@/lib/keep-memory";
import { HALO_BEAD_INSPECT, HALO_GOLD_INSPECT } from "@/lib/keep-inspect";
import { haloJuice } from "@/lib/halo-juice";
import { harvestStyleFromDom } from "@/lib/harvest-style";
import { keepSlotRem } from "@/lib/keep-land";
import {
  getPhoneHomeSeatedIds,
  subscribePhoneHomeSeated,
} from "@/lib/home-pack";
import {
  keepHexPair,
  homeStyleFromDom,
  type HomeInk,
} from "@/lib/home-style";

const GOLD_FADE_MS = 260;
const RANK_NAME = ["new", "bronze", "silver", "gold"] as const;

function inProgressBeads(chips: HarvestChip[], seatedDue: string[] | null) {
  if (!seatedDue) {
    return sortKeepBeads(chips).filter((chip) => keepRank(chip) < 3);
  }
  const seated = new Set(seatedDue);
  const extra = chips.filter(
    (chip) => isDueChip(chip) && !seated.has(chip.id) && keepRank(chip) < 3
  );
  const merged = new Map<string, HarvestChip>();
  for (const chip of [...sortKeepBeads(chips), ...extra]) {
    merged.set(chip.id, chip);
  }
  return [...merged.values()]
    .sort((a, b) => {
      const rank = keepRank(b) - keepRank(a);
      if (rank) return rank;
      return (a.keptAt ?? 0) - (b.keptAt ?? 0);
    })
    .slice(0, KEEP_CAP);
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
  const [seatedDue, setSeatedDue] = useState<string[] | null>(() =>
    getPhoneHomeSeatedIds()
  );
  const live = inProgressBeads(chips, seatedDue);
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
  const [ink, setInk] = useState<HomeInk>("citrus");
  const [dark, setDark] = useState(false);
  const [slot, setSlot] = useState("1.02rem");
  const dockRef = useRef<HTMLDivElement>(null);
  const [fadeLeft, setFadeLeft] = useState(false);
  const [fadeRight, setFadeRight] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inspect, setInspect] = useState<HarvestChip | null>(null);
  const [panelTop, setPanelTop] = useState(72);

  useEffect(() => {
    return subscribePhoneHomeSeated(() => setSeatedDue(getPhoneHomeSeatedIds()));
  }, []);

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
      setFadeLeft(false);
      setFadeRight(false);
      return;
    }
    const dock = el;
    let snapToNewest = true;
    function measure() {
      const overflow = dock.scrollWidth > dock.clientWidth + 1;
      if (snapToNewest && overflow) {
        dock.scrollLeft = dock.scrollWidth;
        snapToNewest = false;
      }
      const max = dock.scrollWidth - dock.clientWidth;
      setFadeLeft(overflow && dock.scrollLeft > 1);
      setFadeRight(overflow && dock.scrollLeft < max - 1);
    }
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(el);
    dock.addEventListener("scroll", measure, { passive: true });
    return () => {
      watch.disconnect();
      dock.removeEventListener("scroll", measure);
    };
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

  useLayoutEffect(() => {
    if (!inspect) return;
    const box = wrapRef.current?.getBoundingClientRect();
    if (box) setPanelTop(Math.round(box.bottom + 8));
  }, [inspect]);

  useEffect(() => {
    function onGoldInspect() {
      setInspect(null);
    }
    window.addEventListener(HALO_GOLD_INSPECT, onGoldInspect);
    return () => window.removeEventListener(HALO_GOLD_INSPECT, onGoldInspect);
  }, []);

  useEffect(() => {
    if (!inspect) return;
    window.dispatchEvent(new Event(HALO_BEAD_INSPECT));
  }, [inspect]);

  useEffect(() => {
    if (!inspect) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setInspect(null);
    }
    function onCoveHome() {
      setInspect(null);
    }
    function onPointer(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setInspect(null);
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
  }, [inspect]);

  const inspectRank = inspect ? RANK_NAME[Math.min(keepRank(inspect), 2)] : "";
  const inspectView = inspect ? keepInspectView(inspect) : null;

  return (
    <div className="keep-pocket-wrap" ref={wrapRef}>
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
          className={`keep-dock keep-dock--beads${
            fadeLeft ? " is-fade-left" : ""
          }${fadeRight ? " is-fade-right" : ""}`}
          title="Keep"
          style={
            {
              "--keep-n": String(Math.max(1, beads.length)),
              "--keep-slot": slot,
            } as CSSProperties
          }
        >
          <div className="keep-dock__row">
          {beads.map((chip, i) => {
            const rank = keepRank(chip);
            const band =
              i > 0 && keepRank(beads[i - 1]) !== rank ? " keep-bead--band" : "";
            const newest =
              (chip.keptAt ?? 0) === newestAt && newestAt > 0 ? " is-newest" : "";
            const leaving = fading.some((item) => item.id === chip.id)
              ? " is-leaving-gold"
              : "";
            const rankLabel = RANK_NAME[Math.min(rank, 2)];
            return (
            <button
              key={chip.id}
              type="button"
              className={`keep-bead keep-bead--dock keep-bead--${chip.kind} keep-bead--rank-${rank}${band}${newest}${leaving}`}
              data-peek={chip.token}
              title={`${KIND_LABEL[chip.kind]} · ${chip.token} · ${rankLabel}`}
              aria-label={`${KIND_LABEL[chip.kind]} ${chip.token}, ${rankLabel}`}
              aria-expanded={inspect?.id === chip.id}
              style={{ background: keepHexPair(ink, chip.kind, dark).lo }}
              onClick={(event) => {
                event.stopPropagation();
                haloJuice("object");
                setInspect((current) => (current?.id === chip.id ? null : chip));
              }}
              onPointerDown={(event) => event.stopPropagation()}
            />
            );
          })}
          <span className="keep-land" data-keep-land="" aria-hidden />
          </div>
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
    {inspect && inspectView ? (
      <div
        className="keep-inspect-panel"
        role="dialog"
        aria-label={`${inspectView.head} kept`}
        style={{ "--inspect-panel-top": `${panelTop}px` } as CSSProperties}
      >
        <p className="gold-kept-head">{inspectView.head}</p>
        <p className="keep-inspect-rank">
          {KIND_LABEL[inspect.kind]} · {inspectRank}
        </p>
        {inspectView.prompt ? (
          <p className="keep-inspect-prompt">{inspectView.prompt}</p>
        ) : null}
        {inspectView.answer ? (
          <p className="keep-inspect-answer">{inspectView.answer}</p>
        ) : null}
      </div>
    ) : null}
    </div>
  );
}
