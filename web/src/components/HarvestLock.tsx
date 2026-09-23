"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { DictateButton } from "@/components/DictateButton";
import { KIND_LABEL, type HarvestChip } from "@/lib/harvest";
import {
  lockChipLog,
  lockChoicesStack,
  lockInKicker,
  lockPlayMode,
  type HarvestLockFinish,
  type HarvestLockLive,
} from "@/lib/harvest-lock";
import { scoreLockIn } from "@/lib/open-score";
import { isOpenRecall } from "@/lib/chip-recall";
import { clozeForChip } from "@/lib/open-cloze";
import { haloJuice } from "@/lib/halo-juice";

export { LOCK_IN_KICKER, LOCK_IN_SEE_KICKER, LOCK_IN_SAY_KICKER } from "@/lib/harvest-lock";

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function lockOrder(chips: HarvestChip[]) {
  const open = chips.filter((chip) => isOpenRecall(chip));
  const closed = chips.filter((chip) => !isOpenRecall(chip));
  return [...open, ...closed];
}

export function HarvestLock({
  chips,
  onFinish,
  onLive,
}: {
  chips: HarvestChip[];
  onFinish: (result: HarvestLockFinish) => void;
  onLive?: (live: HarvestLockLive) => void;
}) {
  const ordered = useMemo(() => lockOrder(chips), [chips]);
  const [index, setIndex] = useState(0);
  const [said, setSaid] = useState("");
  const [miss, setMiss] = useState(false);
  const [hit, setHit] = useState<string | null>(null);
  const [missId, setMissId] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const claimedRef = useRef<HarvestChip[]>([]);
  const droppedRef = useRef<HarvestChip[]>([]);
  const logsRef = useRef<HarvestLockFinish["outcomes"]>([]);
  const missesRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const advanceTimer = useRef<number | null>(null);
  const chip = ordered[index];
  const mode = chip ? lockPlayMode(chip) : "see";
  const cloze = useMemo(() => {
    if (!chip || !isOpenRecall(chip)) return null;
    return clozeForChip(chip, 1, "see");
  }, [chip]);

  const picks = useMemo(() => {
    if (!chip) return [];
    if (isOpenRecall(chip)) {
      return (cloze?.choices ?? []).map((choice) => choice.label);
    }
    const extras = (chip.distractors ?? []).slice(0, 3);
    return shuffle([chip.token || chip.answer, ...extras]).slice(0, 4);
  }, [chip, cloze]);

  const stack = lockChoicesStack(picks);

  useEffect(() => {
    const remaining = ordered.slice(index).map((item) => item.id);
    onLive?.({
      claimedIds: claimedRef.current.map((item) => item.id),
      droppedIds: droppedRef.current.map((item) => item.id),
      remainingIds: remaining,
    });
  }, [index, ordered, onLive]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !chip) return;
    root.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const wrap = root.closest("[data-harvest-lock]");
    wrap?.querySelectorAll("[data-harvest]").forEach((mark) => {
      mark.classList.toggle(
        "is-lock-current",
        mark.getAttribute("data-harvest") === chip.id
      );
    });
    return () => {
      wrap?.querySelectorAll("[data-harvest]").forEach((mark) => {
        mark.classList.remove("is-lock-current");
      });
    };
  }, [chip]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    };
  }, []);

  if (!ordered.length || !chip) return null;
  const current = chip;
  const see = mode === "see";

  function emit(keep: HarvestChip[], extra = logsRef.current) {
    onFinish({
      keep,
      dropped: droppedRef.current,
      outcomes: extra,
    });
  }

  function passOne() {
    haloJuice("lock");
    claimedRef.current = [...claimedRef.current, current];
    logsRef.current = [
      ...logsRef.current,
      lockChipLog(current, "claimed", missesRef.current),
    ];
    missesRef.current = 0;
    setMiss(false);
    setMissId(null);
    setHit(null);
    setSaid("");
    setListening(false);
    setVoiceError(null);
    if (index + 1 >= ordered.length) {
      emit(claimedRef.current);
      return;
    }
    setIndex((n) => n + 1);
  }

  function check(text: string) {
    if (hit) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    const result = see
      ? {
          ok: cloze
            ? cloze.choices.some(
                (choice) => choice.correct && choice.label === trimmed
              )
            : trimmed === current.token || trimmed === current.answer,
        }
      : scoreLockIn({
          prompt: current.prompt,
          expected: current.answer,
          said: trimmed,
          token: current.token,
          recall: "open",
        });
    if (result.ok) {
      setHit(trimmed);
      setMiss(false);
      advanceTimer.current = window.setTimeout(() => {
        passOne();
      }, 280);
      return;
    }
    missesRef.current += 1;
    setMiss(true);
    setMissId(trimmed);
  }

  function skipRest() {
    const rest = ordered.slice(index);
    const keep = [...claimedRef.current, ...rest];
    const extra = rest.map((item, i) =>
      lockChipLog(item, "skip", i === 0 ? missesRef.current : 0)
    );
    emit(keep, [...logsRef.current, ...extra]);
  }

  function dropCurrent() {
    droppedRef.current = [...droppedRef.current, current];
    logsRef.current = [
      ...logsRef.current,
      lockChipLog(current, "drop", missesRef.current),
    ];
    missesRef.current = 0;
    setMiss(false);
    setMissId(null);
    setHit(null);
    setSaid("");
    setListening(false);
    if (index + 1 >= ordered.length) {
      emit(claimedRef.current);
      return;
    }
    setIndex((n) => n + 1);
  }

  return (
    <div
      ref={rootRef}
      className="harvest-lock"
      data-kind={current.kind}
      data-lock-chip={current.id}
      data-lock-mode={mode}
    >
      <div className="harvest-lock__band compose-play-band">
        <p className="compose-play-kind">{KIND_LABEL[current.kind]}</p>
      </div>
      <div className="harvest-lock__body compose-play-beat">
        {ordered.length > 1 ? (
          <ol className="compose-play-dots" aria-label="Facts to keep">
            {ordered.map((item, i) => {
              const filled = i < index;
              const currentDot = i === index;
              return (
                <li
                  key={item.id}
                  className={`compose-play-dot${
                    filled ? " is-filled" : currentDot ? " is-current" : ""
                  }`}
                  style={{ "--dot-i": String(i) } as CSSProperties}
                />
              );
            })}
          </ol>
        ) : null}
        <p className="harvest-lock__kicker">{lockInKicker(mode)}</p>
        <p className="compose-play-prompt harvest-lock__prompt">
          {see && cloze ? cloze.stem : current.prompt}
        </p>
        {see ? (
          <div
            className={`home-play-choices${stack ? " home-play-choices--stack" : ""}`}
            role="group"
            aria-label="Choices"
          >
            {picks.map((pick, i) => (
              <button
                key={pick}
                type="button"
                className={`home-play-choice${
                  missId === pick ? " is-locked" : ""
                }${hit === pick ? " is-ok" : ""}${
                  hit && hit !== pick ? " is-dim" : ""
                }`}
                style={{ "--choice-i": String(i) } as CSSProperties}
                disabled={missId === pick || Boolean(hit)}
                onClick={() => check(pick)}
              >
                {pick}
              </button>
            ))}
          </div>
        ) : (
          <div className="harvest-lock__say">
            <textarea
              className={`home-play-say${hit ? " is-ok" : ""}${miss ? " is-miss" : ""}`}
              value={said}
              rows={3}
              placeholder="In your own words"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              aria-label="Type the answer"
              disabled={Boolean(hit)}
              onChange={(e) => {
                setSaid(e.target.value);
                setMiss(false);
                setVoiceError(null);
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.shiftKey) return;
                e.preventDefault();
                check(said);
              }}
            />
            <div className="harvest-lock__say-actions">
              <DictateButton
                value={said}
                onValueChange={(next) => {
                  setSaid(next);
                  setMiss(false);
                }}
                listening={listening}
                onListeningChange={setListening}
                disabled={Boolean(hit)}
                onBlocked={setVoiceError}
              />
              <button
                type="button"
                className="stone-btn harvest-lock__check"
                disabled={Boolean(hit) || !said.trim()}
                onClick={() => check(said)}
              >
                Check
              </button>
            </div>
            {voiceError ? <p className="harvest-lock__voice">{voiceError}</p> : null}
          </div>
        )}
        {miss ? (
          <div className="compose-play-miss" role="status">
            <p className="compose-play-miss-kicker">Not quite —</p>
            <blockquote className="compose-play-quote">{current.answer}</blockquote>
          </div>
        ) : null}
        <div className="harvest-lock__foot">
          <button type="button" className="harvest-lock__skip" onClick={skipRest}>
            Save without saying
          </button>
          <button type="button" className="harvest-lock__drop" onClick={dropCurrent}>
            Don&apos;t keep this
          </button>
        </div>
      </div>
    </div>
  );
}
