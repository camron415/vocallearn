"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AnswerBody } from "@/components/AnswerBody";
import { AttachButton, AttachList } from "@/components/AttachButton";
import { ComposeField } from "@/components/ComposeField";
import { DictateButton } from "@/components/DictateButton";
import { HaloHeader } from "@/components/HaloHeader";
import { HarvestFlights } from "@/components/HarvestFlights";
import { HarvestLock } from "@/components/HarvestLock";
import { CollectFlights } from "@/components/CollectFlights";
import { type HistoryItem } from "@/components/HistoryMenu";
import { MessageActions } from "@/components/MessageActions";
import { WorkTrace, type WorkStep } from "@/components/WorkTrace";
import { useAskShell } from "@/components/AskShell";
import { useEffectiveMotion, useMotionSettings } from "@/components/MotionProvider";
import {
  SpringStage,
  COMPOSE_TRAVEL_MS,
  captureComposeMorph,
  clearComposeHandoff,
  pinComposeGhost,
  travelComposeTowardHero,
  useComposeMorph,
} from "@/components/SpringStage";
import { ComposeStadium, WaterAction } from "@/components/WaterSurface";
import {
  PREVIEW_HARVEST_CHIPS,
  PREVIEW_HARVEST_REPLY,
  PREVIEW_MORE_CHIP,
  existingDueHarvest,
  sameHarvestFact,
  type HarvestChip,
} from "@/lib/harvest";
import { readKeepChips } from "@/lib/keep-memory";
import { readHaloStream, type HaloStreamEvent } from "@/lib/halo-stream";
import { PREVIEW_RECIPE_ASK, PREVIEW_RECIPE_REPLY } from "@/lib/save-offer";
import {
  FIRST_HARVEST_LINE,
  revealFirstHarvestLine,
} from "@/lib/first-harvest-line";
import {
  lockChipLog,
  type HarvestLockChipLog,
  type HarvestLockLive,
} from "@/lib/harvest-lock";
import { reportHarvestLock } from "@/lib/harvest-lock-track";
import {
  LOCK_IN_DELAY_MS,
  clearPendingLock,
  readPendingLock,
  writePendingLock,
} from "@/lib/lock-pending";
import { isLabPreviewPath, labPreviewChatHref, labPreviewHomeHref } from "@/lib/lab-preview";
import { stripMarkdownForDisplay } from "@/lib/markdown-plain";
import { readAttachments } from "@/lib/read-files";
import {
  clearAskAttachments,
  peekAskAttachments,
} from "@/lib/pending-attach";
import { takePendingResume, peekPendingResume } from "@/lib/pending-turn";
import type { AskMessage, HaloProfile } from "@/lib/types";

const RESUME_MS = 3 * 60 * 1000;
const generating = new Set<string>();
/** Survives Strict Mode / RSC remount of the same chat so we don't double-stream. */
const resumeDone = new Set<string>();
const turnAborts = new Map<string, AbortController>();

type SaveOfferState = {
  kind: "recipe";
  status: "ready" | "saving" | "saved" | "error";
  error?: string;
};

/** Scroll the thread pane only. scrollIntoView also scrolls the page and slides the composer under the keys. */
function scrollInsideThread(el: HTMLElement | null, edge: "start" | "end") {
  const scroller = el?.closest(".chat-scroll");
  if (!el || !(scroller instanceof HTMLElement)) return;
  if (edge === "end") {
    scroller.scrollTop = scroller.scrollHeight;
    return;
  }
  const delta =
    el.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
  scroller.scrollTop += delta;
}

function shouldResume(messages: AskMessage[]) {
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user") return false;
  const at = Date.parse(last.created_at);
  if (!Number.isFinite(at)) return true;
  return Date.now() - at < RESUME_MS;
}

export function ChatThread({
  conversationId,
  title,
  initialMessages,
  conversations = [],
  homeHref = "/ask",
  demo = false,
  saveDemo = false,
  profile,
}: {
  conversationId: string;
  title: string;
  initialMessages: AskMessage[];
  conversations?: HistoryItem[];
  homeHref?: string;
  demo?: boolean;
  saveDemo?: boolean;
  profile?: HaloProfile;
}) {
  const router = useRouter();
  const shell = useAskShell();
  const soft = useEffectiveMotion() === "reduced";
  const harvestReduced = useMotionSettings().prefersReduced;
  const [messages, setMessages] = useState(initialMessages);
  const [localDraft, setLocalDraft] = useState("");
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [localSending, setLocalSending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localListening, setLocalListening] = useState(false);
  const draft = shell?.active ? shell.draft : localDraft;
  const setDraft = shell?.active ? shell.setDraft : setLocalDraft;
  const files = shell?.active ? shell.files : localFiles;
  const setFiles = shell?.active ? shell.setFiles : setLocalFiles;
  const sending = shell?.active ? shell.sending : localSending;
  const setSending = shell?.active ? shell.setSending : setLocalSending;
  const error = shell?.active ? shell.error : localError;
  const setError = shell?.active ? shell.setError : setLocalError;
  const listening = shell?.active ? shell.listening : localListening;
  const setListening = shell?.active ? shell.setListening : setLocalListening;
  const [freshIds, setFreshIds] = useState<Set<string>>(() => new Set());
  const [streamText, setStreamText] = useState("");
  const [workSteps, setWorkSteps] = useState<WorkStep[]>([]);
  const [thinking, setThinking] = useState("");
  const [showWork, setShowWork] = useState(false);
  const [chats, setChats] = useState(conversations);
  const [harvest, setHarvest] = useState<HarvestChip[]>([]);
  const [flying, setFlying] = useState<HarvestChip[]>([]);
  const [lockChips, setLockChips] = useState<HarvestChip[]>([]);
  const lockChipsRef = useRef<HarvestChip[]>([]);
  const lockLive = useRef<HarvestLockLive>({
    claimedIds: [],
    droppedIds: [],
    remainingIds: [],
  });
  const lockTimer = useRef<number | null>(null);
  const [keptLine, setKeptLine] = useState(false);
  const [saveOffers, setSaveOffers] = useState<Record<string, SaveOfferState>>(
    {}
  );
  const [collectToken, setCollectToken] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreTaken, setMoreTaken] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const turnStartRef = useRef<HTMLDivElement | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const leaving = useRef(false);
  const [exit, setExit] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bufferRef = useRef("");
  const flushTimer = useRef<number | null>(null);
  const pendingLand = useRef(0);
  const demoHarvested = useRef(false);
  const runTurnRef = useRef<(
    opts: {
      text?: string;
      resume?: boolean;
      attachments?: { name: string; type: string; data: string }[];
    }
  ) => Promise<"ok" | "blocked" | "fail">>(async () => "fail");

  const landChip = useCallback((chip: HarvestChip) => {
    if (!existingDueHarvest(readKeepChips(), chip)) {
      window.dispatchEvent(new CustomEvent("halo-keep-add", { detail: chip }));
    }
    pendingLand.current = Math.max(0, pendingLand.current - 1);
    if (pendingLand.current > 0) return;
    if (demo || saveDemo) return;
    if (revealFirstHarvestLine()) setKeptLine(true);
  }, [demo, saveDemo]);

  const landCollect = useCallback((token: string) => {
    setSaveOffers((prev) => ({
      ...prev,
      [token]: { kind: "recipe", status: "saved" },
    }));
    setCollectToken(null);
    const pocket = document.querySelector("[data-saves-pocket]");
    pocket?.classList.add("is-collect-hit");
    window.setTimeout(() => pocket?.classList.remove("is-collect-hit"), 700);
  }, []);

  function rememberSaveOffer(messageId: string) {
    if (!messageId) return;
    setSaveOffers((prev) => {
      if (prev[messageId]?.status === "saved") return prev;
      return { ...prev, [messageId]: { kind: "recipe", status: "ready" } };
    });
  }

  function beginHarvest(chips: HarvestChip[]) {
    if (!chips.length) return;
    const kept = readKeepChips();
    const toFly = chips.filter(
      (chip) =>
        !kept.some(
          (item) => item.id === chip.id || sameHarvestFact(item, chip)
        )
    );
    setHarvest((prev) => {
      const seen = new Set(prev.map((item) => item.id));
      return [...prev, ...chips.filter((chip) => !seen.has(chip.id))];
    });
    setMoreOpen(true);
    if (!toFly.length) return;
    window.dispatchEvent(
      new CustomEvent("halo-harvest-begin", {
        detail: { count: toFly.length },
      })
    );
    lockLive.current = {
      claimedIds: [],
      droppedIds: [],
      remainingIds: toFly.map((chip) => chip.id),
    };
    if (!demo && !saveDemo) writePendingLock(conversationId, toFly);
    if (lockTimer.current) window.clearTimeout(lockTimer.current);
    lockTimer.current = window.setTimeout(() => {
      lockTimer.current = null;
      lockChipsRef.current = toFly;
      setLockChips(toFly);
    }, LOCK_IN_DELAY_MS);
  }

  function settleLock(
    keep: HarvestChip[],
    opts: {
      fly: boolean;
      walkAway?: boolean;
      outcomes: HarvestLockChipLog[];
    }
  ) {
    if (lockTimer.current) {
      window.clearTimeout(lockTimer.current);
      lockTimer.current = null;
    }
    lockChipsRef.current = [];
    lockLive.current = { claimedIds: [], droppedIds: [], remainingIds: [] };
    setLockChips([]);
    clearPendingLock();
    if (!demo && !saveDemo) {
      reportHarvestLock({
        conversationId,
        walkAway: opts.walkAway,
        chips: opts.outcomes,
      });
    }
    if (!keep.length) return;
    if (!opts.fly) {
      for (const chip of keep) {
        if (!existingDueHarvest(readKeepChips(), chip)) {
          window.dispatchEvent(new CustomEvent("halo-keep-add", { detail: chip }));
        }
      }
      return;
    }
    pendingLand.current = keep.length;
    window.setTimeout(() => {
      setFlying((prev) => {
        const known = new Set(prev.map((item) => item.id));
        return [...prev, ...keep.filter((chip) => !known.has(chip.id))];
      });
    }, 120);
  }

  function walkAwayKeep() {
    const live = lockLive.current;
    const chips = lockChipsRef.current.length
      ? lockChipsRef.current
      : readPendingLock(conversationId);
    if (!chips.length) return;
    const dropped = new Set(live.droppedIds);
    const claimed = new Set(live.claimedIds);
    const keep = chips.filter((chip) => !dropped.has(chip.id));
    const outcomes = chips.map((chip) => {
      if (dropped.has(chip.id)) return lockChipLog(chip, "drop");
      if (claimed.has(chip.id)) return lockChipLog(chip, "claimed");
      return lockChipLog(chip, "skip");
    });
    settleLock(keep, { fly: false, walkAway: true, outcomes });
  }

  useComposeMorph(dockRef, !soft && !shell?.active);

  useLayoutEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const stage = dock.closest(".chat-stage") as HTMLElement | null;
    const sync = () => {
      stage?.style.setProperty("--chat-dock-h", `${dock.offsetHeight}px`);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(dock);
    return () => {
      ro.disconnect();
      stage?.style.removeProperty("--chat-dock-h");
    };
  }, [draft, files.length, sending, shell?.active]);

  function goHome() {
    if (leaving.current) return;
    walkAwayKeep();
    turnAborts.get(conversationId)?.abort();
    const dest = demo || isLabPreviewPath() ? labPreviewHomeHref() : homeHref;
    if (soft) {
      clearComposeHandoff();
      router.replace(dest);
      return;
    }
    if (shell?.active) {
      leaving.current = true;
      shell.leaveToHome(() => {
        router.replace(dest);
        leaving.current = false;
      });
      return;
    }
    leaving.current = true;
    travelComposeTowardHero(dockRef.current);
    setExit(true);
    window.setTimeout(() => {
      pinComposeGhost(dockRef.current);
      captureComposeMorph(dockRef.current);
      router.replace(dest);
    }, COMPOSE_TRAVEL_MS);
  }

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (demo || saveDemo) return;
    const pending = readPendingLock(conversationId);
    if (!pending.length) return;
    lockChipsRef.current = pending;
    setLockChips(pending);
  }, [conversationId, demo, saveDemo]);

  useEffect(() => {
    return () => {
      if (lockTimer.current) window.clearTimeout(lockTimer.current);
    };
  }, []);

  useEffect(() => {
    const fromKeep = readKeepChips().filter((chip) => chip.askId === conversationId);
    if (fromKeep.length) setHarvest(fromKeep);
  }, [conversationId]);

  useEffect(() => {
    if (conversations.length) setChats(conversations);
  }, [conversations]);

  useEffect(() => {
    if (demo) return;
    let cancelled = false;
    void fetch("/api/chats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { conversations?: HistoryItem[] } | null) => {
        if (cancelled || !Array.isArray(data?.conversations)) return;
        setChats(data.conversations);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [conversationId, demo]);

  function replayHarvest() {
    if (lockTimer.current) {
      window.clearTimeout(lockTimer.current);
      lockTimer.current = null;
    }
    lockChipsRef.current = [];
    lockLive.current = { claimedIds: [], droppedIds: [], remainingIds: [] };
    setHarvest([]);
    setFlying([]);
    setLockChips([]);
    setMoreOpen(false);
    window.dispatchEvent(new Event("halo-keep-reset"));
    window.setTimeout(() => beginHarvest(PREVIEW_HARVEST_CHIPS), 80);
  }

  useEffect(() => {
    if (!demo || saveDemo) return;
    const ready = messages.some(
      (row) => row.role === "assistant" && row.content.includes("Nile")
    );
    if (!ready) return;
    const t = window.setTimeout(() => {
      if (demoHarvested.current) return;
      demoHarvested.current = true;
      beginHarvest(PREVIEW_HARVEST_CHIPS);
    }, 640);
    return () => window.clearTimeout(t);
  }, [demo, saveDemo, messages]);

  useEffect(() => {
    if (!saveDemo) return;
    const assistant = [...initialMessages]
      .reverse()
      .find((row) => row.role === "assistant" && row.content.trim());
    if (assistant) rememberSaveOffer(assistant.id);
  }, [saveDemo, initialMessages]);

  useEffect(() => {
    if (!demo) return;
    function onReplay() {
      replayHarvest();
    }
    function onClear() {
      setHarvest([]);
      setFlying([]);
      setLockChips([]);
      setSaveOffers({});
      setCollectToken(null);
      setMoreOpen(false);
      setMoreTaken(false);
      demoHarvested.current = false;
    }
    function onLive(event: Event) {
      const detail = (event as CustomEvent<{
        chips?: HarvestChip[];
        reply?: string;
        skipped?: boolean;
        appendReply?: boolean;
      }>).detail;
      if (!detail || detail.skipped) return;
      if (detail.reply && detail.appendReply) {
        const replyId = `lab-${Date.now()}`;
        const replyText = detail.reply;
        markFresh(replyId);
        setMessages((prev) => [
          ...prev,
          {
            id: replyId,
            conversation_id: conversationId,
            role: "assistant",
            content: replyText,
            created_at: new Date().toISOString(),
          },
        ]);
      }
      if (detail.chips?.length) beginHarvest(detail.chips);
    }
    function onSaveDemo() {
      const userId = "save-demo-user";
      const replyId = "save-demo-assistant";
      setHarvest([]);
      setFlying([]);
      setLockChips([]);
      setSaveOffers({});
      setCollectToken(null);
      setMoreOpen(false);
      setMoreTaken(false);
      demoHarvested.current = true;
      markFresh(replyId);
      setMessages([
        {
          id: userId,
          conversation_id: conversationId,
          role: "user",
          content: PREVIEW_RECIPE_ASK,
          created_at: new Date().toISOString(),
        },
        {
          id: replyId,
          conversation_id: conversationId,
          role: "assistant",
          content: PREVIEW_RECIPE_REPLY,
          created_at: new Date().toISOString(),
        },
      ]);
      rememberSaveOffer(replyId);
    }
    window.addEventListener("halo-harvest-replay", onReplay);
    window.addEventListener("halo-harvest-clear", onClear);
    window.addEventListener("halo-harvest-live", onLive);
    window.addEventListener("halo-save-offer-demo", onSaveDemo);
    return () => {
      window.removeEventListener("halo-harvest-replay", onReplay);
      window.removeEventListener("halo-harvest-clear", onClear);
      window.removeEventListener("halo-harvest-live", onLive);
      window.removeEventListener("halo-save-offer-demo", onSaveDemo);
    };
  }, [demo, conversationId]);

  useEffect(() => {
    scrollInsideThread(bottomRef.current, "end");
  }, [conversationId]);

  useEffect(() => {
    if (!sending) return;
    scrollInsideThread(turnStartRef.current, "start");
  }, [sending]);

  useEffect(() => {
    return () => {
      // Do not abort here. Home→Chat remounts ChatThread for the same id
      // (Strict Mode, RSC payload). Aborting the resume fetch is why the
      // stream died and Camron had to send "?" to start a new turn.
      generating.delete(conversationId);
      if (flushTimer.current != null) window.clearTimeout(flushTimer.current);
    };
  }, [conversationId]);

  function markFresh(id: string) {
    setFreshIds((prev) => new Set(prev).add(id));
  }

  function flushBuffer(force = false) {
    const pending = bufferRef.current;
    if (!pending) return;
    if (!force && !pending.includes("\n") && pending.length < 12) return;
    bufferRef.current = "";
    setStreamText((prev) => prev + pending);
  }

  function queueDelta(text: string) {
    bufferRef.current += text;
    if (text.includes("\n")) {
      flushBuffer(true);
      return;
    }
    if (flushTimer.current != null) window.clearTimeout(flushTimer.current);
    flushTimer.current = window.setTimeout(() => flushBuffer(true), 28);
  }

  function handleLive(event: HaloStreamEvent) {
    if (event.type === "status") {
      setShowWork(true);
      setWorkSteps((prev) => {
        const id = `${event.status}-${event.detail || prev.length}`;
        if (prev.some((step) => step.id === id || (step.kind === event.status && step.detail === event.detail))) {
          return prev;
        }
        return [...prev, { id, kind: event.status, detail: event.detail }];
      });
      return;
    }
    if (event.type === "thinking") {
      setShowWork(true);
      setThinking((prev) => prev + event.text);
      return;
    }
    if (event.type === "delta") {
      queueDelta(event.text);
    }
    if (event.type === "harvest") {
      beginHarvest(event.chips);
    }
    if (event.type === "saveOffer") {
      rememberSaveOffer(event.messageId);
    }
  }

  async function playDemo() {
    setShowWork(true);
    setWorkSteps([{ id: "search", kind: "searching" }]);
    await new Promise((r) => window.setTimeout(r, 520));
    setWorkSteps((prev) => [
      ...prev,
      { id: "read", kind: "reading", detail: "britannica.com" },
    ]);
    const chunks = PREVIEW_HARVEST_REPLY.match(/\s+|\S+/g) ?? [PREVIEW_HARVEST_REPLY];
    for (const chunk of chunks) {
      queueDelta(chunk);
      await new Promise((r) => window.setTimeout(r, 18));
    }
    flushBuffer(true);
    setStreamText("");
    const replyId = `demo-${Date.now()}`;
    markFresh(replyId);
    setMessages((prev) => [
      ...prev,
      {
        id: replyId,
        conversation_id: conversationId,
        role: "assistant",
        content: PREVIEW_HARVEST_REPLY,
        created_at: new Date().toISOString(),
      },
    ]);
    beginHarvest(PREVIEW_HARVEST_CHIPS);
  }

  async function runTurn(opts: {
    text?: string;
    resume?: boolean;
    attachments?: { name: string; type: string; data: string }[];
  }): Promise<"ok" | "blocked" | "fail"> {
    if (generating.has(conversationId)) {
      abortRef.current?.abort();
      generating.delete(conversationId);
    }
    generating.add(conversationId);
    setSending(true);
    setError(null);
    setStreamText("");
    setWorkSteps([]);
    setThinking("");
    setShowWork(true);
    bufferRef.current = "";

    if (demo) {
      try {
        await playDemo();
        return "ok";
      } finally {
        setSending(false);
        setShowWork(false);
        setStreamText("");
        setWorkSteps([]);
        setThinking("");
        generating.delete(conversationId);
      }
    }

    abortRef.current?.abort();
    turnAborts.get(conversationId)?.abort();
    const armed =
      opts.resume && !opts.text ? takePendingResume(conversationId) : null;
    const abort = armed?.abort ?? new AbortController();
    abortRef.current = abort;
    turnAborts.set(conversationId, abort);
    let result: "ok" | "blocked" | "fail" = "fail";

    const onStreamEvent = (event: HaloStreamEvent) => {
      if (event.type === "error") {
        setError(event.error);
        return;
      }
      if (event.type === "done") {
        flushBuffer(true);
        setStreamText("");
        setWorkSteps([]);
        setThinking("");
        setShowWork(false);
        markFresh(event.reply.id);
        setMessages((prev) => [...prev, event.reply]);
        setSending(false);
        result = "ok";
        return;
      }
      if (event.type === "harvest") {
        beginHarvest(event.chips);
        return;
      }
      if (event.type === "saveOffer") {
        rememberSaveOffer(event.messageId);
        return;
      }
      handleLive(event);
    };

    try {
      if (armed) {
        try {
          await armed.replayAndFollow(onStreamEvent, abort.signal);
          return result;
        } catch (err) {
          if ((err as { name?: string }).name === "AbortError") throw err;
        }
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          conversationId,
          message: opts.text,
          resume: opts.resume || (armed ? true : undefined),
          attachments: opts.attachments,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
        signal: abort.signal,
      });

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message =
          (data as { error?: string }).error || "Failed to send";
        // Assistant already landed (first resume completed after a remount).
        if (opts.resume && res.status === 409) {
          result = "ok";
          router.refresh();
          return "ok";
        }
        result = "blocked";
        throw new Error(message);
      }

      if (!contentType.includes("text/event-stream")) {
        const data = await res.json();
        const reply = data.reply as AskMessage;
        markFresh(reply.id);
        setMessages((prev) => [...prev, reply]);
        result = "ok";
        return "ok";
      }

      await readHaloStream(res, onStreamEvent, abort.signal);
      return result;
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return "fail";
      setError(err instanceof Error ? err.message : "Something went wrong");
      return result === "blocked" ? "blocked" : "fail";
    } finally {
      const superseded = turnAborts.get(conversationId) !== abort;
      if (!superseded) {
        turnAborts.delete(conversationId);
        generating.delete(conversationId);
      }
      if (abortRef.current === abort) {
        flushBuffer(true);
        setSending(false);
        setStreamText("");
        setWorkSteps([]);
        setThinking("");
        setShowWork(false);
      }
    }
  }

  runTurnRef.current = runTurn;

  const lastInitial = initialMessages[initialMessages.length - 1];
  const lastInitialId = lastInitial?.id ?? "";
  const lastInitialRole = lastInitial?.role ?? "";

  useEffect(() => {
    if (demo) return;
    if (resumeDone.has(conversationId)) return;
    let live = false;
    const key = `halo-ask-live:${conversationId}`;
    try {
      live = sessionStorage.getItem(key) === "1";
    } catch {
      live = false;
    }
    if (!live && !shouldResume(initialMessages)) return;

    let cancelled = false;

    async function attemptResume() {
      for (let i = 0; i < 3; i += 1) {
        if (cancelled) return;
        const pendingFiles = peekAskAttachments(conversationId);
        const result = await runTurnRef.current({
          resume: true,
          attachments: pendingFiles.length ? pendingFiles : undefined,
        });
        if (result === "ok") {
          resumeDone.add(conversationId);
          clearAskAttachments(conversationId);
          try {
            sessionStorage.removeItem(key);
          } catch {
            /* private browsing */
          }
          return;
        }
        if (cancelled || result === "blocked") return;
        await new Promise((resolve) => window.setTimeout(resolve, 240));
      }
    }

    // Delay past Strict Mode's immediate unmount so we start one fetch, not two.
    // If Home already started the stream, attach immediately so thinking is on screen.
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      void attemptResume();
    }, peekPendingResume(conversationId) ? 0 : 80);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // lastInitial* retriggers if the page hydrates the user row after first paint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, demo, lastInitialId, lastInitialRole]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if ((!text && files.length === 0) || sending) return;

    setListening(false);
    setDraft("");
    const pending = files;
    setFiles([]);
    const localId = `local-${Date.now()}`;
    markFresh(localId);
    setMessages((prev) => [
      ...prev,
      {
        id: localId,
        conversation_id: conversationId,
        role: "user",
        content: pending.length
          ? `${text || "Look at this."}\n\n[Attached: ${pending.map((f) => f.name).join(", ")}]`
          : text,
        created_at: new Date().toISOString(),
      },
    ]);
    const attachments = pending.length ? await readAttachments(pending) : undefined;
    const result = await runTurn({ text: text || undefined, attachments });
    if (result === "blocked") {
      setMessages((prev) => prev.filter((row) => row.id !== localId));
      setDraft(text);
      setFiles(pending);
    }
  }

  useEffect(() => {
    if (!shell?.active) return;
    shell.setSubmitHandler((event) => onSubmit(event));
    return () => shell.setSubmitHandler(null);
  }, [shell, conversationId, draft, files, sending]);

  const lastUserId = [...messages].reverse().find((row) => row.role === "user")?.id;
  const lastAssistantId = [...messages]
    .reverse()
    .find((row) => row.role === "assistant" && row.content.trim())?.id;

  async function saveOfferedRecipe(messageId: string) {
    const offer = saveOffers[messageId];
    if (!offer || offer.status === "saved" || offer.status === "saving") return;
    setSaveOffers((prev) => ({
      ...prev,
      [messageId]: { kind: "recipe", status: "saving" },
    }));
    if (demo) {
      setCollectToken(messageId);
      return;
    }
    try {
      const markdown =
        messages.find((row) => row.id === messageId)?.content ?? "";
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, markdown }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setSaveOffers((prev) => ({
          ...prev,
          [messageId]: {
            kind: "recipe",
            status: "error",
            error: data.error || "Could not save that recipe.",
          },
        }));
        return;
      }
      setCollectToken(messageId);
    } catch {
      setSaveOffers((prev) => ({
        ...prev,
        [messageId]: {
          kind: "recipe",
          status: "error",
          error: "Could not save that recipe.",
        },
      }));
    }
  }

  return (
    <div className={`chat-stage is-entering${exit ? " is-leaving" : ""}`} data-harvest-capture="true">
      <HaloHeader
        conversations={chats}
        currentId={conversationId}
        title={stripMarkdownForDisplay(title)}
        homeHref={homeHref}
        showHome
        demo={demo}
        profile={profile}
        onGoHome={goHome}
        onOpenChat={(id) => {
          if (id === conversationId) return;
          if (demo || isLabPreviewPath()) {
            clearComposeHandoff();
            router.replace(labPreviewChatHref(id));
            return;
          }
          if (!shell?.active) captureComposeMorph(dockRef.current);
          router.push(`/ask/${id}`);
        }}
        onDeleted={(id) => {
          setChats((prev) => prev.filter((chat) => chat.id !== id));
          if (id !== conversationId) return;
          captureComposeMorph(null);
          router.replace(demo || isLabPreviewPath() ? labPreviewHomeHref() : homeHref);
        }}
      />

      <SpringStage>
        <div className="chat-scroll">
          {messages.length === 0 && !sending ? (
            <p className="chat-empty">Ask anything to start this thread.</p>
          ) : null}
          {messages.map((m) => {
            if (m.role === "assistant" && !m.content.trim()) return null;
            const lastUser = m.id === lastUserId;
            return (
              <div
                key={m.id}
                ref={lastUser ? turnStartRef : undefined}
                className={`msg-wrap msg-wrap--${m.role}${
                  freshIds.has(m.id) ? " msg-wrap--fresh" : ""
                }`}
                {...(m.role === "assistant" && !sending && m.id === lastAssistantId
                  ? {
                      "data-harvest-origin": "true",
                      ...(lockChips.length ? { "data-harvest-lock": "true" } : {}),
                    }
                  : {})}
              >
                <div
                  className={`msg msg--${m.role}${
                    freshIds.has(m.id) ? " msg--fresh" : ""
                  }`}
                >
                  {m.role === "assistant" ? (
                    <AnswerBody
                      content={m.content}
                      harvest={harvest}
                      saveHighlight={Boolean(saveOffers[m.id])}
                    />
                  ) : (
                    <p>{stripMarkdownForDisplay(m.content)}</p>
                  )}
                </div>
                {m.role !== "system" ? (
                <MessageActions
                  role={m.role}
                  content={m.content}
                  save={saveOffers[m.id]}
                  saveOrigin={m.id}
                  onSave={
                    saveOffers[m.id]
                      ? () => void saveOfferedRecipe(m.id)
                      : undefined
                  }
                  onEdit={
                    m.role === "user"
                      ? () => {
                          setDraft(stripMarkdownForDisplay(m.content));
                          window.requestAnimationFrame(() => {
                            const field = document.getElementById(
                              shell?.active ? "ask-shell-field" : "followup"
                            );
                            if (field instanceof HTMLElement) {
                              field.focus({ preventScroll: true });
                            }
                          });
                        }
                      : undefined
                  }
                />
                ) : null}
                {m.role === "assistant" &&
                m.id === lastAssistantId &&
                lockChips.length &&
                !sending ? (
                  <HarvestLock
                    chips={lockChips}
                    onLive={(live) => {
                      lockLive.current = live;
                    }}
                    onFinish={(result) =>
                      settleLock(result.keep, {
                        fly: true,
                        outcomes: result.outcomes,
                      })
                    }
                  />
                ) : null}
              </div>
            );
          })}
          {/* Tutorial-only extra harvest. Live Ask never shows this. */}
          {demo && moreOpen && !moreTaken && !sending ? (
            <button
              type="button"
              className="harvest-more"
              onClick={() => {
                setMoreTaken(true);
                beginHarvest([PREVIEW_MORE_CHIP]);
              }}
            >
              Want a little more on this?
            </button>
          ) : null}
          {keptLine ? (
            <p className="harvest-kept-line">{FIRST_HARVEST_LINE}</p>
          ) : null}
          {sending ? (
            <div className="msg-wrap msg-wrap--assistant" data-harvest-origin="true">
              <div className="msg msg--assistant msg--live">
                {showWork || workSteps.length > 0 || thinking ? (
                  <WorkTrace
                    steps={workSteps}
                    thinking={thinking}
                    collapsed={streamText.length > 40}
                    waiting={!streamText && workSteps.length === 0 && !thinking}
                  />
                ) : (
                  <WorkTrace
                    steps={[]}
                    thinking=""
                    collapsed={false}
                    waiting
                  />
                )}
                {streamText ? (
                  <AnswerBody content={streamText} streaming />
                ) : null}
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
      </SpringStage>

      {!shell?.active ? (
      <ComposeStadium className="compose compose-dock" elementRef={dockRef} listening={listening}>
        <form onSubmit={onSubmit} className="compose-form">
          {error ? <p className="form-error">{error}</p> : null}
          <AttachList
            files={files}
            onRemove={(file) =>
              setFiles((prev) => prev.filter((f) => f !== file))
            }
          />
          <label className="sr-only" htmlFor="followup">
            Follow up
          </label>
          <div className="compose-row">
            <ComposeField
              id="followup"
              placeholder="Follow up…"
              value={draft}
              onValueChange={setDraft}
              disabled={sending}
            />
            <div className="compose-actions">
              <AttachButton
                files={files}
                onFiles={setFiles}
                disabled={sending}
                onError={setError}
              />
              <DictateButton
                value={draft}
                onValueChange={setDraft}
                listening={listening}
                onListeningChange={setListening}
                disabled={sending}
                onBlocked={setError}
              />
              <WaterAction
                className="action-btn"
                disabled={sending || (!draft.trim() && files.length === 0)}
              >
                Send
              </WaterAction>
            </div>
          </div>
        </form>
      </ComposeStadium>
      ) : null}
      <HarvestFlights chips={flying} reduced={harvestReduced} onLanded={landChip} />
      <CollectFlights
        token={collectToken}
        reduced={soft}
        onDone={landCollect}
      />
    </div>
  );
}
