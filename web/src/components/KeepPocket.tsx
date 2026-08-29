"use client";

import { useEffect, useLayoutEffect, useState, type CSSProperties } from "react";
import { KIND_LABEL, type HarvestChip } from "@/lib/harvest";
import {
  isBankedChip,
  isMasteredChip,
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

export function KeepPocket({
  chips,
  pocketRef,
}: {
  chips: HarvestChip[];
  pocketRef?: (el: HTMLDivElement | null) => void;
}) {
  const facts = chips.filter(isBankedChip);
  const mastered = chips.filter(isMasteredChip);
  const style = harvestStyleFromDom();
  const dock = style.dock;
  const empty = (!facts.length && !mastered.length) || dock === "absorb";
  const beads = sortKeepBeads(chips);
  const newestAt = beads.reduce((max, chip) => Math.max(max, chip.keptAt ?? 0), 0);
  const rankName = ["new", "bronze", "silver", "gold"] as const;
  const [ink, setInk] = useState<HomeInk>("citrus");
  const [dark, setDark] = useState(false);
  const [slot, setSlot] = useState("0.82rem");

  useLayoutEffect(() => {
    function fit() {
      setSlot(keepSlotRem(beads.length, window.innerWidth));
    }
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [beads.length]);

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
        facts.length || mastered.length
          ? `Keep, ${facts.length} chips${mastered.length ? `, ${mastered.length} mastered` : ""}`
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
          className="keep-dock keep-dock--beads"
          title={
            mastered.length ? `Keep · ${mastered.length} mastered` : "Keep"
          }
          style={
            {
              "--keep-n": String(Math.max(1, beads.length)),
              "--keep-slot": slot,
            } as CSSProperties
          }
        >
          {mastered.length ? (
            <span className="keep-master-n" aria-hidden>
              {mastered.length}
            </span>
          ) : null}
          {beads.map((chip, i) => {
            const rank = keepRank(chip);
            const band =
              i > 0 && keepRank(beads[i - 1]) !== rank ? " keep-bead--band" : "";
            const newest =
              (chip.keptAt ?? 0) === newestAt && newestAt > 0 ? " is-newest" : "";
            return (
            <span
              key={chip.id}
              className={`keep-bead keep-bead--dock keep-bead--${chip.kind} keep-bead--rank-${rank}${
                rank === 3 ? " keep-bead--master" : ""
              }${band}${newest}`}
              title={`${KIND_LABEL[chip.kind]} · ${chip.token} · ${rankName[rank]}`}
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
