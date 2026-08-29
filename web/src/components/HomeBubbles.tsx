"use client";

import {
  type CSSProperties,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { WaterCapsule } from "@/components/WaterCapsule";
import { isQuietHeat, type ChipHeat } from "@/lib/chip-heat";
import {
  parseChipKind,
  KIND_LABEL,
  type HarvestChip,
} from "@/lib/harvest";
import {
  HOME_FIELD,
  HOME_GUTTER,
  HOME_STYLE_DEFAULT,
  homeStyleFromDom,
  keepSeat,
  mixHomePoint,
  type HomeStyle,
} from "@/lib/home-style";
import {
  formatChipLabel,
  keepChipMaxRem,
  keepFieldScale,
  mixKeepOrder,
  packHomeChips,
  seedKeepField,
  type HomeBox,
} from "@/lib/home-pack";
import { LoopFlights, type LoopFlight } from "@/components/LoopFlights";
import { keepLandBox } from "@/lib/keep-land";
import { usePaperLook } from "@/components/MotionProvider";
import {
  pinAsk,
  isDueChip,
  isBankedChip,
  gradeChips,
  readKeepChips,
  readPinnedAsks,
  seedKeepDemo,
  subscribeKeep,
  unpinAsk,
} from "@/lib/keep-memory";
import { rippleWaterRoot } from "@/lib/water-edge";
import type { BubbleItem } from "@/components/BubbleField";

const PIN_KINDS = ["who", "where", "meaning", "when"] as const;
const GATHER_MS = 720;

function clusterKey(chip: HarvestChip) {
  return chip.cluster || chip.id;
}

function familyOf(chip: HarvestChip, board: HarvestChip[]) {
  const key = clusterKey(chip);
  return board.filter((item) => clusterKey(item) === key);
}

function placeSeat(point: { top: number; x: number }): CSSProperties {
  return {
    top: `${point.top}%`,
    left: `calc(50% + ${point.x * 46}%)`,
  };
}

type PlayChoice = {
  id: string;
  label: string;
  correct: boolean;
};

type LearnPlay = {
  cluster: string;
  family: string[];
  order: string[];
  index: number;
  mode: "gather" | "play" | "done";
  miss: string | null;
  hit: string | null;
  choices: PlayChoice[];
};

function shuffleChoices(list: PlayChoice[]) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const hold = next[i];
    next[i] = next[j];
    next[j] = hold;
  }
  return next;
}

function choicesFor(chip: HarvestChip): PlayChoice[] {
  const seen = new Set<string>([chip.token.toLowerCase()]);
  const wrong: PlayChoice[] = [];
  for (const label of chip.distractors ?? []) {
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    wrong.push({ id: `wrong-${wrong.length}-${key}`, label, correct: false });
    if (wrong.length >= 3) break;
  }
  return shuffleChoices([
    { id: chip.id, label: chip.token, correct: true },
    ...wrong.slice(0, 3),
  ]);
}

export function HomeBubbles({
  demo = false,
  white = [],
  onAsk,
  onOpenSource,
}: {
  demo?: boolean;
  white?: BubbleItem[];
  onAsk: (item: BubbleItem, el: HTMLButtonElement | null) => void;
  onOpenSource: () => void;
}) {
  const [kept, setKept] = useState<HarvestChip[]>([]);
  const [pins, setPins] = useState(() => readPinnedAsks());
  const [home, setHome] = useState<HomeStyle>(HOME_STYLE_DEFAULT);
  const [packed, setPacked] = useState<Record<string, { x: number; y: number }>>(
    {}
  );
  const [lessonRoot, setLessonRoot] = useState<HTMLElement | null>(null);
  const [gatherAt, setGatherAt] = useState<Record<string, { x: number; y: number }>>(
    {}
  );
  const [play, setPlay] = useState<LearnPlay | null>(null);
  const [cooled, setCooled] = useState<Record<string, ChipHeat>>({});
  const [arrived, setArrived] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  const answering = useRef(false);
  const paper = usePaperLook();
  const packedRef = useRef(packed);
  const keepIdsRef = useRef<Set<string> | null>(null);
  const [loopFlights, setLoopFlights] = useState<LoopFlight[]>([]);
  const [dropping, setDropping] = useState<Record<string, true>>({});

  useEffect(() => {
    if (demo) seedKeepDemo();
    setKept(readKeepChips());
    setPins(readPinnedAsks());
    setHome(homeStyleFromDom());
    function onStyle(event: Event) {
      const next = (event as CustomEvent<HomeStyle>).detail;
      setHome(next ?? homeStyleFromDom());
    }
    window.addEventListener("halo-home-style", onStyle);
    return () => {
      window.removeEventListener("halo-home-style", onStyle);
    };
  }, [demo]);

  useEffect(() => {
    return subscribeKeep(() => {
      setKept(readKeepChips());
      setPins(readPinnedAsks());
    });
  }, []);

  const scatter = home.scatter / 100;
  packedRef.current = packed;
  const board = mixKeepOrder(
    kept.filter(isDueChip).slice(0, home.keepCount)
  );
  const pale = white.slice(0, 4);
  const packKey = `${board.length}|${board
    .map((chip) => `${chip.id}:${chip.kind}:${chip.token.length}:${heatOf(chip)}`)
    .join(",")}|${pale.map((item) => `${item.id}:${item.title.length}`).join(",")}`;

  const packedReady =
    board.length === 0 || board.every((chip) => packed[chip.id]);

  useEffect(() => {
    if (arrived) return;
    if (!packedReady) return;
    if (board.length === 0) {
      setArrived(true);
      return;
    }
    const lastDelay = Math.min(Math.max(0, board.length - 1), 7) * 40;
    const id = window.setTimeout(() => setArrived(true), lastDelay + 1160);
    return () => window.clearTimeout(id);
  }, [arrived, packedReady, board.length]);

  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const stage = field;
    let frame = 0;
    stage.dataset.keepCount = String(board.length);

    function layout() {
      const origin = stage.getBoundingClientRect();
      if (origin.width < 40 || origin.height < 40) return;
      const scale = keepFieldScale({ w: origin.width, h: origin.height });
      /* Chip padding/type are CSS constants. Scale only the long-label cap. */
      stage.style.setProperty(
        "--keep-chip-max",
        `${(keepChipMaxRem(board.length) * scale).toFixed(2)}rem`
      );
      void stage.offsetWidth;
      const slots = [...stage.querySelectorAll<HTMLElement>(".recent-slot")];
      const measured = slots.flatMap((slot) => {
        const id = slot.dataset.packId;
        if (!id) return [];
        const heat = slot.dataset.heat as ChipHeat | undefined;
        return [
          {
            id,
            w: slot.offsetWidth,
            h: slot.offsetHeight,
            hue: slot.dataset.hue || undefined,
            heat:
              heat === "hot" ||
              heat === "warm" ||
              heat === "rest" ||
              heat === "locked"
                ? heat
                : undefined,
            group: slot.dataset.cluster || id,
          },
        ];
      });
      // Seats avoid the suggest corridor by design. Do not wall off compose —
      // that shoved corner seats into a heart ring.
      const walls = [".ask-greeting", ".topbar"].flatMap((sel) => {
        const node = document.querySelector(sel);
        if (!node) return [];
        const box = node.getBoundingClientRect();
        return [
          {
            x: box.left - origin.left,
            y: box.top - origin.top,
            w: box.width,
            h: box.height,
          },
        ];
      });
      const seeds = seedKeepField(
        measured,
        { w: origin.width, h: origin.height },
        walls
      );
      const byId = new Map(seeds.map((seed) => [seed.id, seed]));
      const boxes: HomeBox[] = measured.map((item) => {
        const seed = byId.get(item.id);
        return {
          id: item.id,
          group: item.group,
          hue: item.hue,
          heat: item.heat,
          w: item.w,
          h: item.h,
          x: seed?.x ?? 0,
          y: seed?.y ?? 0,
        };
      });
      const next = packHomeChips(boxes, walls, {
        w: origin.width,
        h: origin.height,
      });
      const spots: Record<string, { x: number; y: number }> = {};
      for (const box of next) {
        spots[box.id] = { x: box.x, y: box.y };
      }
      setPacked(spots);
    }

    function schedule() {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(layout);
    }

    schedule();
    const watch = new ResizeObserver(schedule);
    watch.observe(stage);
    const compose = document.querySelector(".compose");
    if (compose) watch.observe(compose);

    return () => {
      window.cancelAnimationFrame(frame);
      watch.disconnect();
    };
  }, [packKey, board.length]);

  useLayoutEffect(() => {
    if (!play || play.mode !== "gather" || !play.family.length) return;
    const origin = fieldRef.current?.getBoundingClientRect();
    const compose = document
      .querySelector(".ask-hero .compose")
      ?.getBoundingClientRect();
    if (!origin || !compose) return;
    const next: Record<string, { x: number; y: number }> = {};
    for (const id of play.family) {
      const slot = fieldRef.current?.querySelector<HTMLElement>(
        `[data-pack-id="${id}"]`
      );
      const w = slot?.offsetWidth ?? 88;
      const h = slot?.offsetHeight ?? 40;
      next[id] = {
        x: compose.left - origin.left + compose.width / 2 - w / 2,
        y: compose.top - origin.top + compose.height / 2 - h / 2,
      };
    }
    const frame = window.requestAnimationFrame(() => setGatherAt(next));
    return () => window.cancelAnimationFrame(frame);
  }, [play?.cluster, play?.mode, packed]);

  useEffect(() => {
    if (!play || play.mode !== "gather") return;
    const timer = window.setTimeout(() => {
      setPlay((prev) => {
        if (!prev) return prev;
        const lead = board.find((item) => item.id === prev.order[0]);
        return {
          ...prev,
          mode: "play",
          hit: null,
          choices: lead ? choicesFor(lead) : prev.choices,
        };
      });
    }, GATHER_MS);
    return () => window.clearTimeout(timer);
  }, [play?.cluster, play?.mode, board]);

  useEffect(() => {
    if (!play) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      answering.current = false;
      setPlay(null);
      setGatherAt({});
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [play]);

  function heatOf(chip: HarvestChip): ChipHeat {
    return cooled[chip.id] ?? chip.heat ?? "warm";
  }

  function slotStyle(
    id: string,
    seed: CSSProperties,
    cast: boolean
  ): CSSProperties {
    const spot = packed[id];
    // Keep seed off-screen until pack — keepSeat is a 4×4 grid and flashes
    // over the greeting if it paints for even one frame.
    if (!spot) {
      return { opacity: 0, pointerEvents: "none" };
    }
    const target = cast ? gatherAt[id] : null;
    const folding = Boolean(cast && gatherAt[id]);
    const dx = target ? target.x - spot.x : 0;
    const dy = target ? target.y - spot.y : 0;
    return {
      top: spot.y,
      left: spot.x,
      transform: folding
        ? `translate3d(${dx}px, ${dy}px, 0) scale(0.52)`
        : dx || dy
          ? `translate3d(${dx}px, ${dy}px, 0)`
          : undefined,
    };
  }

  function startLearn(chip: HarvestChip, el: HTMLButtonElement | null) {
    if (play) return;
    if (!isDueChip(chip)) return;
    const family = familyOf(chip, board);
    if (!family.some((item) => item.id === chip.id)) return;
    const order = [chip, ...family.filter((item) => item.id !== chip.id)].map(
      (item) => item.id
    );
    const familyIds = order;
    setPlay({
      cluster: clusterKey(chip),
      family: familyIds,
      order,
      index: 0,
      mode: "gather",
      miss: null,
      hit: null,
      choices: choicesFor(chip),
    });
    if (paper) return;
    const x = el?.getBoundingClientRect().left ?? 0;
    const y = el?.getBoundingClientRect().top ?? 0;
    for (const id of familyIds) {
      const slot = fieldRef.current?.querySelector<HTMLElement>(
        `[data-pack-id="${id}"] .capsule`
      );
      if (slot) rippleWaterRoot(slot, x, y, true);
    }
  }

  function holdSource(chip: HarvestChip, el: HTMLButtonElement | null) {
    if (play) return;
    const family = familyOf(chip, board);
    const familyIds = new Set(family.map((item) => item.id));
    const field = fieldRef.current;
    field?.querySelectorAll<HTMLElement>(".recent-slot").forEach((slot) => {
      const id = slot.dataset.packId;
      if (id && familyIds.has(id)) slot.classList.add("is-chorus", "is-diving");
      else slot.classList.add("is-recede");
    });
    const box = el?.getBoundingClientRect();
    for (const item of family) {
      const cap = field?.querySelector<HTMLElement>(
        `[data-pack-id="${item.id}"] .capsule`
      );
      if (cap) rippleWaterRoot(cap, box?.left ?? 0, box?.top ?? 0, true);
    }
    onOpenSource();
  }

  function pocketRect() {
    return keepLandBox();
  }

  function addLoopFlight(flight: LoopFlight) {
    setLoopFlights((prev) => [...prev, flight]);
  }

  function finishPlay() {
    setPlay((prev) =>
      prev ? { ...prev, mode: "done", miss: null, hit: null, choices: [] } : prev
    );
    window.setTimeout(() => {
      setPlay(null);
      setGatherAt({});
      answering.current = false;
    }, 720);
  }

  function advanceFrom(from: LearnPlay) {
    const due = readKeepChips().filter(isDueChip);
    for (let i = from.index + 1; i < from.order.length; i++) {
      const nextChip = due.find((item) => item.id === from.order[i]);
      if (!nextChip) continue;
      answering.current = false;
      setPlay({
        ...from,
        index: i,
        miss: null,
        hit: null,
        mode: "play",
        choices: choicesFor(nextChip),
      });
      return;
    }
    finishPlay();
  }

  function answerChoice(choice: PlayChoice, el: HTMLButtonElement | null) {
    if (!play || play.mode !== "play" || answering.current) return;
    const chipId = play.order[play.index];
    const chip = board.find((item) => item.id === chipId);
    if (!choice.correct) {
      answering.current = true;
      gradeChips([chipId], "miss");
      setPlay({ ...play, miss: choice.id, hit: null });
      window.setTimeout(() => advanceFrom(play), 1100);
      return;
    }
    answering.current = true;
    const from = el?.getBoundingClientRect();
    const pocket = pocketRect();
    setPlay({ ...play, miss: null, hit: choice.id });
    if (from && pocket && chip) {
      addLoopFlight({
        id: `bank-${chip.id}-${Date.now()}`,
        chipId: chip.id,
        token: chip.token,
        kind: chip.kind,
        mode: "bank",
        from: { x: from.left, y: from.top, w: from.width, h: from.height },
        to: {
          x: pocket.left,
          y: pocket.top,
          w: pocket.width,
          h: pocket.height,
        },
      });
    } else {
      gradeChips([chipId], "ok");
    }
    window.setTimeout(() => advanceFrom(play), 720);
  }

  const learning = Boolean(play);
  const current =
    play && play.mode !== "done"
      ? board.find((item) => item.id === play.order[play.index]) ??
        board.find((item) => item.id === play.order[0])
      : null;
  const prompt =
    play?.mode === "done"
      ? "Nice — that set can rest."
      : current?.prompt ?? "";

  useEffect(() => {
    if (!learning) {
      window.dispatchEvent(new Event("halo-home-play-end"));
      delete document.documentElement.dataset.haloPlay;
      setLessonRoot(null);
      return;
    }
    if (play?.mode === "gather") return;
    window.dispatchEvent(
      new CustomEvent("halo-home-play", {
        detail: { prompt, miss: play?.miss ?? null, kind: current?.kind ?? "" },
      })
    );
    document.documentElement.dataset.haloPlay = "1";
    function grab() {
      setLessonRoot(document.querySelector("[data-halo-play-root]"));
    }
    grab();
    const frame = window.requestAnimationFrame(grab);
    const later = window.setTimeout(grab, 40);
    return () => {
      delete document.documentElement.dataset.haloPlay;
      window.dispatchEvent(new Event("halo-home-play-end"));
      window.cancelAnimationFrame(frame);
      window.clearTimeout(later);
    };
  }, [learning, prompt, play?.miss, play?.mode, current?.kind]);

  useEffect(() => {
    const banked = new Set(kept.filter(isBankedChip).map((chip) => chip.id));
    if (!keepIdsRef.current) {
      keepIdsRef.current = banked;
      return;
    }
    const origin = fieldRef.current?.getBoundingClientRect();
    const pocket = pocketRect();
    const spots = packedRef.current;
    const dropped = kept.filter(
      (chip) => isDueChip(chip) && keepIdsRef.current?.has(chip.id)
    );
    keepIdsRef.current = banked;
    if (!origin || !pocket || !dropped.length) return;
    for (const chip of dropped) {
      const spot = spots[chip.id];
      if (!spot) continue;
      setDropping((prev) => ({ ...prev, [chip.id]: true }));
      addLoopFlight({
        id: `drop-${chip.id}-${Date.now()}`,
        chipId: chip.id,
        token: chip.token,
        kind: chip.kind,
        mode: "drop",
        from: {
          x: pocket.left,
          y: pocket.top,
          w: pocket.width,
          h: pocket.height,
        },
        to: { x: origin.left + spot.x, y: origin.top + spot.y, w: 168, h: 48 },
      });
    }
  }, [kept]);

  return (
    <div
      ref={fieldRef}
      className={`recents home-bubbles${learning ? " is-learning" : ""}${
        play?.mode === "play" ? " is-choosing" : ""
      }${!arrived ? " is-arriving" : ""}`}
      aria-label="Home bubbles"
    >
      {lessonRoot && play
        ? createPortal(
            <div className="compose-play" data-kind={current?.kind ?? ""}>
              <div className="compose-play-head">
                <p className="compose-play-kind">
                  {current ? KIND_LABEL[current.kind] : ""}
                </p>
                <div
                  className="compose-play-bar"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={play.order.length}
                  aria-valuenow={
                    play.mode === "done" ? play.order.length : play.index
                  }
                  aria-label={`Card ${play.index + 1} of ${play.order.length}`}
                >
                  <span
                    className="compose-play-ink"
                    style={{
                      width: `${
                        play.mode === "done"
                          ? 100
                          : (play.index / play.order.length) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
              {play.miss ? (
                <p className="compose-play-verdict" role="status">
                  Not that one
                </p>
              ) : (
                <p className="compose-play-verdict compose-play-verdict--spacer" aria-hidden>
                  {" "}
                </p>
              )}
              <p className="compose-play-prompt">{prompt}</p>
              {play.mode === "play" && current ? (
                <div
                  className="home-play-choices"
                  role="group"
                  aria-label="Choices"
                  key={play.order[play.index]}
                >
                  {play.choices.map((choice, i) => (
                    <WaterCapsule
                      key={choice.id}
                      still
                      className={`home-play-choice${
                        play.miss === choice.id ? " is-miss" : ""
                      }${play.hit === choice.id ? " is-ok" : ""}${
                        play.hit && play.hit !== choice.id ? " is-fall" : ""
                      }`}
                      phase={i + 40}
                      title={choice.label}
                      style={{ "--choice-i": String(i) } as CSSProperties}
                      onClick={(el) => answerChoice(choice, el)}
                    >
                      {choice.label}
                    </WaterCapsule>
                  ))}
                </div>
              ) : (
                <div className="home-play-choices home-play-choices--wait" />
              )}
            </div>,
            lessonRoot
          )
        : null}
      <LoopFlights
        flights={loopFlights}
        onDone={(flight) => {
          if (flight.mode === "bank" && flight.chipId) {
            gradeChips([flight.chipId], "ok");
          }
          if (flight.chipId) {
            setDropping((prev) => {
              const next = { ...prev };
              delete next[flight.chipId as string];
              return next;
            });
          }
          setLoopFlights((prev) => prev.filter((item) => item.id !== flight.id));
        }}
      />
      {board.map((chip, i) => {
        const point = keepSeat(i, scatter);
        const heat = heatOf(chip);
        const cast = Boolean(play?.family.includes(chip.id));
        const recede = Boolean(play && (!cast || play.mode === "play"));
        const title = `${chip.token} · click to review · hold for the chat`;
        return (
          <div
            key={chip.id}
            className={`recent-slot keep-album__slot${
              packed[chip.id] ? " is-packed" : ""
            }${cast && play?.mode === "gather" ? " is-cast" : ""}${
              recede ? " is-recede" : ""
            }${dropping[chip.id] ? " is-dropping" : ""}`}
            data-kind="keep"
            data-pack-id={chip.id}
            data-cluster={clusterKey(chip)}
            data-hue={chip.kind}
            data-heat={heat}
            data-member={String(i)}
            data-top={String(point.top)}
            data-x={String(point.x)}
            style={
              {
                ...slotStyle(
                  chip.id,
                  placeSeat(point),
                  cast && play?.mode === "gather"
                ),
                "--keep-delay": `${i * 0.12}s`,
                "--enter-delay": `${Math.min(i, 7) * 40}ms`,
              } as CSSProperties
            }
          >
            <WaterCapsule
              kind={chip.kind}
              heat={isQuietHeat(heat) ? "warm" : heat}
              className="capsule--keep-album"
              phase={i}
              title={title}
              style={
                {
                  "--enter-delay": `${80 + i * 40}ms`,
                } as CSSProperties
              }
              onClick={(el) => {
                startLearn(chip, el);
              }}
              onHold={(el) => {
                holdSource(chip, el);
              }}
            >
              {formatChipLabel(chip.token)}
            </WaterCapsule>
          </div>
        );
      })}
      {pale.map((item, i) => {
        const pin = pins.find((row) => row.id === item.id);
        const point = mixHomePoint(
          HOME_GUTTER.asks[i] ?? HOME_GUTTER.asks[0],
          HOME_FIELD.asks[i] ?? HOME_FIELD.asks[0],
          scatter
        );
        return (
          <div
            key={item.id}
            className={`recent-slot${packed[item.id] ? " is-packed" : ""}${
              play ? " is-recede" : ""
            }`}
            data-kind={pin ? "keep" : "ask"}
            data-slot={i > 1 ? "side" : "corner"}
            data-pack-id={item.id}
            data-cluster={item.id}
            data-hue={pin?.kind ?? "ask"}
            data-member="0"
            data-top={String(point.top)}
            data-x={String(point.x)}
            style={
              {
                ...slotStyle(item.id, placeSeat(point), false),
                "--enter-delay": `${180 + i * 70}ms`,
              } as CSSProperties
            }
          >
            <WaterCapsule
              kind={pin?.kind}
              className={pin ? "is-ask-keep" : ""}
              phase={i + 20}
              title={
                pin
                  ? "Queued · click to ask · hold to undo"
                  : "Click to ask · hold to Keep"
              }
              style={{ "--enter-delay": `${180 + i * 70}ms` } as CSSProperties}
              onClick={(el) => {
                onAsk(item, el);
              }}
              onHold={() => {
                if (pin) unpinAsk(item.id);
                else pinAsk(item.id, parseChipKind(PIN_KINDS[i % PIN_KINDS.length]));
              }}
            >
              {item.title}
            </WaterCapsule>
          </div>
        );
      })}
    </div>
  );
}
