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
  isPhoneHomeView,
  keepChipMaxRem,
  keepFieldScale,
  mixKeepOrder,
  packHomeChips,
  seedKeepField,
  type HomeBox,
} from "@/lib/home-pack";
import { LoopFlights, type LoopFlight } from "@/components/LoopFlights";
import { goldLandBox, keepLandBox } from "@/lib/keep-land";
import { usePaperLook } from "@/components/MotionProvider";
import {
  pinAsk,
  isDueChip,
  isBankedChip,
  roundIndex,
  wouldMasterOnPass,
  recordRoundOpen,
  finishRound,
  keepRank,
  readKeepChips,
  readPinnedAsks,
  seedKeepDemo,
  subscribeKeep,
  unpinAsk,
  HOME_SEAT_CAP,
  type ChipRoundResult,
} from "@/lib/keep-memory";
import { rippleWaterRoot } from "@/lib/water-edge";
import type { BubbleItem } from "@/components/BubbleField";

const PIN_KINDS = ["who", "where", "meaning", "when"] as const;
const GATHER_MS = 720;
const HOLD_OK_MS = 500;
const HOLD_RETRY_MS = 700;
const MISS_HOLD_MS = 1600;
const UNITS = new Set([
  "miles",
  "mile",
  "mi",
  "km",
  "kilometers",
  "kilometres",
  "kilometer",
  "kilometre",
  "m",
  "meters",
  "metres",
  "meter",
  "metre",
  "ft",
  "feet",
  "foot",
]);
const PLACE_PREFIX = /^(mount|mt|lake|the|a|an)\s+/;
const MIN_NAME_LEN = 3;

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

type PlayFace = "see" | "say" | "say-b";
type PlayRound = 1 | 2 | 3;

type PlayBeat = {
  id: string;
  chipId: string;
  face: PlayFace;
};

type LearnPlay = {
  cluster: string;
  family: string[];
  beats: PlayBeat[];
  index: number;
  mode: "gather" | "play" | "end";
  round: PlayRound;
  missId: string | null;
  hitId: string | null;
  retrying: boolean;
  missed: string[];
  quote: boolean;
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

function choiceLabel(chip: HarvestChip) {
  return (chip.answer || chip.token).trim();
}

function choicesFor(chip: HarvestChip): PlayChoice[] {
  const correct = choiceLabel(chip);
  const seen = new Set<string>([correct.toLowerCase()]);
  const wrong: PlayChoice[] = [];
  for (const label of chip.distractors ?? []) {
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    wrong.push({ id: `wrong-${wrong.length}-${key}`, label, correct: false });
    if (wrong.length >= 3) break;
  }
  return shuffleChoices([
    { id: chip.id, label: correct, correct: true },
    ...wrong.slice(0, 3),
  ]);
}

function shuffleBeats(list: PlayBeat[]) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const hold = next[i];
    next[i] = next[j];
    next[j] = hold;
  }
  return next;
}

function roundOf(chip: HarvestChip): PlayRound {
  return roundIndex(chip);
}

/** SEE in cluster order; SAY (and r3 SAY-b) shuffled vs that order. Per-chip round so r3-fail → r1. */
function beatsFor(family: HarvestChip[]): PlayBeat[] {
  const see: PlayBeat[] = [];
  const say: PlayBeat[] = [];
  const sayB: PlayBeat[] = [];
  for (const chip of family) {
    const round = roundOf(chip);
    if (round >= 3) {
      say.push({ id: `${chip.id}:say`, chipId: chip.id, face: "say" });
      sayB.push({ id: `${chip.id}:say-b`, chipId: chip.id, face: "say-b" });
    } else {
      see.push({ id: `${chip.id}:see`, chipId: chip.id, face: "see" });
      say.push({ id: `${chip.id}:say`, chipId: chip.id, face: "say" });
    }
  }
  return [...see, ...shuffleBeats(say), ...shuffleBeats(sayB)];
}

function foldPrompt(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** r3 SAY-b is a second standalone question. Never hint. Never reuse prompt. */
function sayBPrompt(chip: HarvestChip) {
  const a = chip.prompt.trim();
  const b = (chip.promptB ?? "").trim();
  if (b && foldPrompt(b) !== foldPrompt(a)) return b;
  const span = (chip.span || chip.token || chip.answer).trim();
  const fallback: Record<HarvestChip["kind"], string> = {
    when: `Give the year or date for “${span}”.`,
    where: `Which place is “${span}”?`,
    who: `Who or what is named in “${span}”?`,
    meaning: `What exact figure or phrase is “${span}”?`,
  };
  const next = fallback[chip.kind];
  if (foldPrompt(next) !== foldPrompt(a)) return next;
  return `Recall the ${KIND_LABEL[chip.kind].toLowerCase()} for “${span}”.`;
}

function cuePlaceholder(token: string) {
  const letter = token.trim().charAt(0);
  if (!/[A-Za-z0-9]/.test(letter)) return "";
  return `${letter}—— —— ——`;
}

/**
 * Closed SAY grading — word-for-word closed recall, not open paraphrase.
 * Normalize: case, punctuation, commas in numbers, unit aliases, leading the.
 * Who: full name or distinctive last name (≥3 chars), never first-only or 1-letter.
 * Where: full place after Mount/Lake/the strip — exact, not prefix.
 * When / numeric meaning: full digit string must match.
 * Meaning text: exact, or 1-edit if both sides are long (≥8).
 */
function foldClosed(text: string) {
  return text
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripThe(text: string) {
  return text.replace(/^(the|a|an)\s+/, "");
}

function stripUnits(text: string) {
  let next = text;
  for (let i = 0; i < 2; i++) {
    const parts = next.split(" ");
    if (parts.length < 2) break;
    const last = parts[parts.length - 1];
    if (!UNITS.has(last)) break;
    const head = parts.slice(0, -1).join(" ");
    if (!/\d/.test(head)) break;
    next = head;
  }
  return next;
}

function stripPlace(text: string) {
  return text.replace(PLACE_PREFIX, "").trim();
}

function digitsOf(text: string) {
  return text.replace(/\D/g, "");
}

function edits1(a: string, b: string) {
  if (a === b) return true;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0;
  let j = 0;
  let skip = 0;
  while (i < la && j < lb) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    skip += 1;
    if (skip > 1) return false;
    if (la > lb) i += 1;
    else if (lb > la) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }
  return skip + (la - i) + (lb - j) <= 1;
}

function gradeAgainst(said: string, target: string, kind: HarvestChip["kind"]) {
  if (!said || !target) return false;
  if (said === target) return true;
  if (said.length < 2) return false;

  const saidDigits = digitsOf(said);
  const targetDigits = digitsOf(target);
  const numericTarget = /\d/.test(target);

  if (kind === "when" || (numericTarget && saidDigits && targetDigits)) {
    return saidDigits.length >= 2 && saidDigits === targetDigits;
  }

  if (kind === "who") {
    const a = stripPlace(said);
    const b = stripPlace(target);
    if (!a || !b) return false;
    if (a === b) return true;
    const saidParts = a.split(" ").filter(Boolean);
    const targetParts = b.split(" ").filter(Boolean);
    if (saidParts.length === 1 && targetParts.length >= 2) {
      const last = targetParts[targetParts.length - 1]!;
      const first = targetParts[0]!;
      return (
        saidParts[0]!.length >= MIN_NAME_LEN &&
        saidParts[0] === last &&
        saidParts[0] !== first
      );
    }
    return false;
  }

  if (kind === "where") {
    const a = stripPlace(said);
    const b = stripPlace(target);
    if (!a || !b || a.length < MIN_NAME_LEN) return false;
    return a === b;
  }

  if (kind === "meaning" && numericTarget) {
    return saidDigits.length >= 2 && saidDigits === targetDigits;
  }

  if (
    kind === "meaning" &&
    !saidDigits &&
    said.length >= 8 &&
    target.length >= 8 &&
    edits1(said, target)
  ) {
    return true;
  }

  return false;
}

function closedHit(said: string, chip: HarvestChip, cue = "") {
  const variants = [said.trim()];
  if (cue && !said.trim().toLowerCase().startsWith(cue.toLowerCase())) {
    variants.push(cue + said.trim());
  }
  const targets = [chip.answer, chip.token, chip.span]
    .map((t) => (t ?? "").trim())
    .filter(Boolean);

  return variants.some((raw) => {
    const a = stripUnits(stripThe(foldClosed(raw)));
    if (!a) return false;
    return targets.some((target) =>
      gradeAgainst(a, stripUnits(stripThe(foldClosed(target))), chip.kind)
    );
  });
}

function quoteParts(chip: HarvestChip) {
  const hit = chip.span?.trim() || chip.token;
  const hay = chip.answer?.trim() || hit;
  const at = hay.toLowerCase().indexOf(hit.toLowerCase());
  if (at >= 0) {
    return {
      before: hay.slice(0, at),
      hit: hay.slice(at, at + hit.length),
      after: hay.slice(at + hit.length),
    };
  }
  return { before: "", hit: hay, after: "" };
}

function EndBead({
  chipId,
  rank,
  upgrade,
  delay,
  kind,
}: {
  chipId: string;
  rank: number;
  upgrade: boolean;
  delay: number;
  kind: HarvestChip["kind"];
}) {
  const [up, setUp] = useState(false);
  useEffect(() => {
    if (!upgrade) return;
    const id = window.setTimeout(() => setUp(true), delay);
    return () => window.clearTimeout(id);
  }, [upgrade, delay]);
  const shown = Math.max(0, Math.min(3, up ? rank + 1 : rank));
  return (
    <span
      data-end-chip={chipId}
      className={`keep-bead keep-bead--${kind} keep-bead--rank-${shown} compose-play-recap-bead${
        up ? " is-up" : ""
      }`}
      aria-hidden
    />
  );
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
  onOpenSource: (chip: HarvestChip) => void;
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
  const [typed, setTyped] = useState("");
  const [capLine, setCapLine] = useState(false);
  const [cooled, setCooled] = useState<Record<string, ChipHeat>>({});
  const [arrived, setArrived] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLInputElement>(null);
  const answering = useRef(false);
  const holdTimer = useRef(0);
  const pendingBank = useRef<Set<string>>(new Set());
  const pendingCommit = useRef<ChipRoundResult[] | null>(null);
  const pendingGoldPulse = useRef(false);
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
  const dueCap = demo ? home.keepCount : HOME_SEAT_CAP;
  const board = mixKeepOrder(
    kept.filter(isDueChip).slice(0, dueCap)
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
      const view = { w: origin.width, h: origin.height };
      const phone = isPhoneHomeView(view);
      const scale = keepFieldScale(view);
      /* Chip padding/type are CSS constants. Scale only the long-label cap.
         Phone dice needs a tighter cap so five chips fit above the composer. */
      stage.style.setProperty(
        "--keep-chip-max",
        phone
          ? "6.8rem"
          : `${(keepChipMaxRem(board.length) * scale).toFixed(2)}rem`
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
      // Desktop: greeting/topbar only — compose is a corridor seats avoid.
      // Phone: also wall off the composer so dice-5 cannot sit behind it.
      const wallSels = phone
        ? [".ask-greeting", ".topbar", ".compose-stack"]
        : [".ask-greeting", ".topbar"];
      const walls = wallSels.flatMap((sel) => {
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
      const seeds = seedKeepField(measured, view, walls);
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
      const next = packHomeChips(boxes, walls, view, {
        shoveLargeWalls: phone,
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
        const leadId = prev.beats[0]?.chipId;
        const lead = board.find((item) => item.id === leadId);
        const face = prev.beats[0]?.face ?? "see";
        return {
          ...prev,
          mode: "play",
          hitId: null,
          missId: null,
          quote: false,
          choices: face === "see" && lead ? choicesFor(lead) : [],
        };
      });
    }, GATHER_MS);
    return () => window.clearTimeout(timer);
  }, [play?.cluster, play?.mode, board]);

  useEffect(() => {
    if (!play || play.mode !== "play") return;
    if (play.beats[play.index]?.face !== "say") return;
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 720px)").matches) {
      return;
    }
    const id = window.requestAnimationFrame(() => {
      typeRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(id);
  }, [play?.mode, play?.index]);

  useEffect(() => {
    if (!play) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const currentPlay = play;
      if (!currentPlay) return;
      if (currentPlay.mode === "end") {
        closeRound(currentPlay, true);
        return;
      }
      answering.current = false;
      window.clearTimeout(holdTimer.current);
      setPlay(null);
      setTyped("");
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

  function chipById(id: string) {
    return kept.find((item) => item.id === id) ?? board.find((item) => item.id === id);
  }

  function startLearn(chip: HarvestChip, el: HTMLButtonElement | null) {
    if (play) return;
    if (!isDueChip(chip)) return;
    if (!recordRoundOpen(clusterKey(chip))) {
      setCapLine((open) => {
        if (open) return false;
        window.setTimeout(() => setCapLine(false), 3000);
        return true;
      });
      return;
    }
    const family = familyOf(chip, board);
    if (!family.some((item) => item.id === chip.id)) return;
    const ordered = [chip, ...family.filter((item) => item.id !== chip.id)];
    const familyIds = ordered.map((item) => item.id);
    const round = roundOf(chip);
    const beats = beatsFor(ordered);
    const lead = beats[0];
    const leadChip = ordered.find((item) => item.id === lead?.chipId) ?? chip;
    setTyped("");
    setPlay({
      cluster: clusterKey(chip),
      family: familyIds,
      beats,
      index: 0,
      mode: "gather",
      round,
      missId: null,
      hitId: null,
      retrying: false,
      missed: [],
      quote: false,
      choices: lead?.face === "see" ? choicesFor(leadChip) : [],
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
    onOpenSource(chip);
  }

  function pocketRect() {
    return keepLandBox();
  }

  function addLoopFlight(flight: LoopFlight) {
    setLoopFlights((prev) => [...prev, flight]);
  }

  function splitRound(from: LearnPlay) {
    const missed = new Set(from.missed);
    return {
      passed: from.family.filter((id) => !missed.has(id)),
      failed: from.family.filter((id) => missed.has(id)),
    };
  }

  function resultsFor(from: LearnPlay): ChipRoundResult[] {
    const missed = new Set(from.missed);
    return from.family.map((id) => ({ id, passed: !missed.has(id) }));
  }

  function commitRound(results: ChipRoundResult[]) {
    if (results.length) finishRound(results);
  }

  function closeRound(from: LearnPlay, grade: boolean) {
    window.clearTimeout(holdTimer.current);
    answering.current = false;
    if (!grade) {
      setPlay(null);
      setTyped("");
      setGatherAt({});
      return;
    }
    const { passed } = splitRound(from);
    const results = resultsFor(from);
    const pocket = pocketRect();
    const gold = goldLandBox();
    const flights: LoopFlight[] = [];
    const now = Date.now();
    let goldFlights = 0;
    for (const id of passed) {
      const chip = chipById(id);
      const row = document.querySelector(`[data-end-chip="${id}"]`);
      const box = row?.getBoundingClientRect();
      const master = chip ? wouldMasterOnPass(chip) : false;
      const dest = master ? gold ?? pocket : pocket;
      if (!chip || !box || !dest) continue;
      if (master) goldFlights += 1;
      flights.push({
        id: `bank-${id}-${now}`,
        chipId: id,
        token: chip.token,
        kind: chip.kind,
        mode: "bank",
        from: { x: box.left, y: box.top, w: box.width, h: box.height },
        to: {
          x: dest.left,
          y: dest.top,
          w: dest.width,
          h: dest.height,
        },
      });
    }
    setPlay(null);
    setTyped("");
    setGatherAt({});
    if (!flights.length) {
      commitRound(results);
      if (goldFlights) {
        window.dispatchEvent(new Event("halo-gold-pulse"));
      }
      return;
    }
    pendingBank.current = new Set(flights.map((item) => item.id));
    pendingCommit.current = results;
    pendingGoldPulse.current = goldFlights > 0;
    setLoopFlights((prev) => [...prev, ...flights]);
  }

  function advanceFrom(from: LearnPlay) {
    const next = from.index + 1;
    if (next >= from.beats.length) {
      answering.current = false;
      setTyped("");
      setPlay({
        ...from,
        mode: "end",
        index: from.beats.length,
        hitId: null,
        missId: null,
        quote: false,
        retrying: false,
        choices: [],
      });
      return;
    }
    const beat = from.beats[next];
    const nextChip = chipById(beat.chipId);
    answering.current = false;
    setTyped("");
    setPlay({
      ...from,
      index: next,
      missId: null,
      hitId: null,
      quote: false,
      retrying: false,
      mode: "play",
      choices: beat.face === "see" && nextChip ? choicesFor(nextChip) : [],
    });
  }

  function landCorrect(from: LearnPlay) {
    answering.current = true;
    const wait = from.retrying ? HOLD_RETRY_MS : HOLD_OK_MS;
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => advanceFrom(from), wait);
  }

  function answerChoice(choice: PlayChoice) {
    if (!play || play.mode !== "play" || answering.current) return;
    const beat = play.beats[play.index];
    if (!beat || beat.face !== "see") return;
    if (play.missId === choice.id) return;
    if (!choice.correct) {
      answering.current = true;
      setPlay({
        ...play,
        missId: choice.id,
        hitId: null,
        quote: true,
        retrying: true,
        missed: play.missed.includes(beat.chipId)
          ? play.missed
          : [...play.missed, beat.chipId],
      });
      window.clearTimeout(holdTimer.current);
      holdTimer.current = window.setTimeout(() => {
        answering.current = false;
      }, MISS_HOLD_MS);
      return;
    }
    setPlay({
      ...play,
      hitId: choice.id,
      quote: false,
    });
    landCorrect({ ...play, hitId: choice.id, quote: false });
  }

  function answerTyped() {
    if (!play || play.mode !== "play" || answering.current) return;
    const beat = play.beats[play.index];
    if (!beat || beat.face === "see") return;
    const chip = chipById(beat.chipId);
    if (!chip) return;
    const cue =
      roundOf(chip) === 1 && beat.face === "say" ? chip.token.trim().charAt(0) : "";
    if (!typed.trim()) return;
    if (!closedHit(typed, chip, /[A-Za-z0-9]/.test(cue) ? cue : "")) {
      answering.current = true;
      setPlay({
        ...play,
        hitId: null,
        quote: true,
        retrying: true,
        missed: play.missed.includes(beat.chipId)
          ? play.missed
          : [...play.missed, beat.chipId],
      });
      window.clearTimeout(holdTimer.current);
      holdTimer.current = window.setTimeout(() => {
        answering.current = false;
      }, MISS_HOLD_MS);
      return;
    }
    setPlay({ ...play, hitId: "typed", quote: false });
    landCorrect({ ...play, hitId: "typed", quote: false, retrying: play.retrying });
  }

  const learning = Boolean(play);
  const beat = play?.beats[Math.min(play.index, play.beats.length - 1)];
  const current =
    play && play.mode !== "end" && beat ? chipById(beat.chipId) : null;
  const prompt =
    play?.mode === "end"
      ? "You did good."
      : beat?.face === "say-b" && current
        ? sayBPrompt(current)
        : current?.prompt ?? "";
  const playKind = current?.kind ?? (play?.mode === "end" ? chipById(play.family[0])?.kind : undefined);
  const seeCount = play?.beats.filter((item) => item.face === "see").length ?? 0;
  const sayCount = play?.beats.filter((item) => item.face === "say").length ?? 0;
  const splitAfter = seeCount || sayCount;
  const currentRound = current ? roundOf(current) : play?.round ?? 1;
  const rankWeight =
    currentRound === 3 ? 600 : currentRound === 2 ? 500 : 400;

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
        detail: { prompt, miss: play?.missId ?? null, kind: playKind ?? "" },
      })
    );
    document.documentElement.dataset.haloPlay = "1";
    function grab() {
      setLessonRoot(
        document.querySelector("[data-halo-play-root]") as HTMLElement | null
      );
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
  }, [learning, prompt, play?.missId, play?.mode, playKind]);

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
        play?.mode === "play" || play?.mode === "end" ? " is-choosing" : ""
      }${!arrived ? " is-arriving" : ""}`}
      aria-label="Home bubbles"
    >
      {capLine ? (
        <p className="home-day-cap" role="status">
          That&apos;s enough for today. These are waiting for tomorrow.
        </p>
      ) : null}
      {lessonRoot && play
        ? createPortal(
            <div
              className="compose-play"
              data-kind={playKind ?? ""}
              data-play-round={String(play.round)}
              style={{ "--play-weight": String(rankWeight) } as CSSProperties}
            >
              <div className="compose-play-band">
                <p className="compose-play-kind">
                  {current
                    ? KIND_LABEL[current.kind]
                    : playKind
                      ? KIND_LABEL[playKind]
                      : ""}
                </p>
              </div>
              <div className="compose-play-col">
                <ol
                  className="compose-play-dots"
                  aria-label="Round progress"
                >
                  {play.beats.map((item, i) => {
                    const filled =
                      play.mode === "end" || i < play.index;
                    const currentDot =
                      play.mode !== "end" && i === play.index;
                    const split = i === splitAfter;
                    return (
                      <li
                        key={item.id}
                        className={`compose-play-dot${
                          filled ? " is-filled" : currentDot ? " is-current" : ""
                        }${split ? " is-split" : ""}`}
                        style={{ "--dot-i": String(i) } as CSSProperties}
                      />
                    );
                  })}
                </ol>
                {play.mode === "end" ? (
                  <div className="compose-play-end" key="end">
                    <p className="compose-play-headline">You did good.</p>
                    {(() => {
                      const { passed, failed } = splitRound(play);
                      const mixed = passed.length > 0 && failed.length > 0;
                      const renderRows = (
                        ids: string[],
                        fail: boolean,
                        start: number
                      ) =>
                        ids.map((id, i) => {
                          const chip = chipById(id);
                          if (!chip) return null;
                          const rank = keepRank(chip);
                          return (
                            <li
                              key={id}
                              className={`compose-play-recap-row${
                                fail ? " is-fail" : ""
                              }`}
                              style={
                                {
                                  "--row-i": String(start + i),
                                } as CSSProperties
                              }
                            >
                              <EndBead
                                chipId={id}
                                rank={rank}
                                upgrade={!fail}
                                delay={(start + i) * 60 + 200}
                                kind={chip.kind}
                              />
                              <span className="compose-play-recap-cue">
                                {chip.token}
                              </span>
                              <span className="compose-play-recap-gap">
                                {" "}
                                —{" "}
                              </span>
                              <span className="compose-play-recap-answer">
                                {chip.answer}
                              </span>
                            </li>
                          );
                        });
                      return (
                        <div className="compose-play-recap-wrap">
                          {mixed ? (
                            <p className="compose-play-recap-label">Banked</p>
                          ) : null}
                          {passed.length ? (
                            <ul className="compose-play-recap">
                              {renderRows(passed, false, 0)}
                            </ul>
                          ) : null}
                          {mixed ? (
                            <p className="compose-play-recap-label">
                              Still working
                            </p>
                          ) : null}
                          {failed.length ? (
                            <ul className="compose-play-recap">
                              {renderRows(failed, true, passed.length)}
                            </ul>
                          ) : null}
                        </div>
                      );
                    })()}
                    <button
                      type="button"
                      className="stone-btn compose-play-done"
                      onClick={() => closeRound(play, true)}
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div
                    className="compose-play-beat"
                    key={beat?.id ?? play.index}
                  >
                    {play.quote && current ? (
                      <div className="compose-play-miss" role="status">
                        <p className="compose-play-miss-kicker">Not quite —</p>
                        <blockquote className="compose-play-quote">
                          {(() => {
                            const parts = quoteParts(current);
                            return (
                              <>
                                {parts.before}
                                <em>{parts.hit}</em>
                                {parts.after}
                              </>
                            );
                          })()}
                        </blockquote>
                      </div>
                    ) : null}
                    <p className="compose-play-prompt">{prompt}</p>
                    {play.mode === "play" && current && beat?.face === "see" ? (
                      <div
                        className="home-play-choices"
                        role="group"
                        aria-label="Choices"
                      >
                        {play.choices.map((choice, i) => (
                          <button
                            key={choice.id}
                            type="button"
                            className={`home-play-choice${
                              play.missId === choice.id ? " is-locked" : ""
                            }${play.hitId === choice.id ? " is-ok" : ""}${
                              play.hitId && play.hitId !== choice.id
                                ? " is-dim"
                                : ""
                            }`}
                            style={{ "--choice-i": String(i) } as CSSProperties}
                            disabled={
                              play.missId === choice.id || Boolean(play.hitId)
                            }
                            onClick={() => answerChoice(choice)}
                          >
                            {choice.label}
                          </button>
                        ))}
                      </div>
                    ) : play.mode === "play" && current ? (
                      <input
                        ref={typeRef}
                        className={`home-play-say${
                          play.hitId === "typed" ? " is-ok" : ""
                        }${play.quote ? " is-miss" : ""}`}
                        value={typed}
                        onChange={(event) => setTyped(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter") return;
                          event.preventDefault();
                          answerTyped();
                        }}
                        placeholder={
                          roundOf(current) === 1 && beat?.face === "say"
                            ? cuePlaceholder(current.token)
                            : ""
                        }
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        enterKeyHint="done"
                        inputMode="text"
                        onPointerDown={(event) => {
                          if (!window.matchMedia("(max-width: 720px)").matches) {
                            return;
                          }
                          event.preventDefault();
                          typeRef.current?.focus({ preventScroll: true });
                        }}
                        onFocus={() => {
                          typeRef.current?.scrollIntoView({
                            block: "nearest",
                            inline: "nearest",
                          });
                        }}
                        disabled={Boolean(play.hitId)}
                        aria-label="Type the answer"
                      />
                    ) : (
                      <div className="home-play-choices home-play-choices--wait" />
                    )}
                  </div>
                )}
              </div>
            </div>,
            lessonRoot
          )
        : null}
      <LoopFlights
        flights={loopFlights}
        onDone={(flight) => {
          if (flight.chipId && flight.mode !== "bank") {
            setDropping((prev) => {
              const next = { ...prev };
              delete next[flight.chipId as string];
              return next;
            });
          }
          setLoopFlights((prev) => prev.filter((item) => item.id !== flight.id));
          if (!pendingBank.current.has(flight.id)) return;
          pendingBank.current.delete(flight.id);
          if (pendingBank.current.size === 0 && pendingCommit.current) {
            const results = pendingCommit.current;
            const pulse = pendingGoldPulse.current;
            pendingCommit.current = null;
            pendingGoldPulse.current = false;
            commitRound(results);
            if (pulse) window.dispatchEvent(new Event("halo-gold-pulse"));
          }
        }}
      />
      {board.map((chip, i) => {
        const point = keepSeat(i, scatter);
        const heat = heatOf(chip);
        const cast = Boolean(play?.family.includes(chip.id));
        const recede = Boolean(play && (!cast || play.mode !== "gather"));
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
