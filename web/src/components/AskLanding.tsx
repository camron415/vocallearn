"use client";

import { FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AttachButton, AttachList } from "@/components/AttachButton";
import { HomeBubbles } from "@/components/HomeBubbles";
import { ComposeField } from "@/components/ComposeField";
import { ComposeSuggest } from "@/components/ComposeSuggest";
import { DictateButton } from "@/components/DictateButton";
import { HaloHeader } from "@/components/HaloHeader";
import { useEffectiveMotion } from "@/components/MotionProvider";
import {
  SpringStage,
  COMPOSE_TRAVEL_MS,
  captureComposeMorph,
  rememberHeroCompose,
  resetComposeTravel,
  travelComposeTowardDock,
  pinComposeGhost,
  useComposeMorph,
  clearComposeHandoff,
} from "@/components/SpringStage";
import { abortAskShellTravel, useAskShell } from "@/components/AskShell";
import { ComposeStadium, WaterAction } from "@/components/WaterSurface";
import { matchPrompts, topIdlePrompts } from "@/lib/prompt-trie";
import { suggestChips, type SuggestChip } from "@/lib/suggest-chips";
import { readAttachments } from "@/lib/read-files";
import { stashAskAttachments } from "@/lib/pending-attach";
import { abortPendingTurn, armPendingStream } from "@/lib/pending-turn";
import { HALO_CONVERSATION_HEADER } from "@/lib/ask-stream-headers";
import {
  isBankedChip,
  isDueChip,
  isMasteredChip,
  readKeepChips,
  shouldShowClearGreeting,
  subscribeKeep,
} from "@/lib/keep-memory";
import {
  getUserTimeZone,
  rememberUserTimeZone,
  resolveUserTimeZone,
  timeGreeting,
} from "@/lib/local-day";
import { isLabPreviewPath, labPreviewChatHref } from "@/lib/lab-preview";
import { useCoarsePointer } from "@/lib/coarse-pointer";
import type { ChipKind } from "@/lib/harvest";
import type { AskConversation, HaloProfile } from "@/lib/types";

const IDLE_MS = 420;
const IDLE_COUNT = 4;
const TYPE_COUNT = 5;

export function AskLanding({
  conversations,
  displayName,
  profile,
  demo = false,
  initialChips,
}: {
  conversations: AskConversation[];
  displayName: string;
  profile?: HaloProfile;
  demo?: boolean;
  initialChips?: SuggestChip[];
}) {
  const router = useRouter();
  const shell = useAskShell();
  const soft = useEffectiveMotion() === "reduced";
  const coarse = useCoarsePointer();
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
  const [composeOpen, setComposeOpen] = useState(false);
  const [idleReady, setIdleReady] = useState(false);
  const [activeHint, setActiveHint] = useState(0);
  const [filled, setFilled] = useState(false);
  const composeFocus = useRef(0);
  const [chats, setChats] = useState(conversations);
  const composeRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const leaving = useRef(false);
  const [localEntering, setLocalEntering] = useState(!soft);
  const entering = shell?.active
    ? Boolean(shell.contentEntering && shell.mode === "home")
    : localEntering;
  const [dueCount, setDueCount] = useState<number | null>(null);
  const [keptCount, setKeptCount] = useState(0);
  const [justCleared, setJustCleared] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [timeZone, setTimeZone] = useState("");
  const [playing, setPlaying] = useState(false);
  const [grown, setGrown] = useState(false);
  const [playKind, setPlayKind] = useState<ChipKind | "">("");
  const prevDue = useRef<number | null>(null);

  useComposeMorph(composeRef, !soft && !shell?.active);

  useEffect(() => {
    function on(event: Event) {
      const kind = (event as CustomEvent<{ kind?: ChipKind }>).detail?.kind;
      setPlayKind(kind === "when" || kind === "where" || kind === "who" || kind === "meaning" ? kind : "");
      setPlaying(true);
    }
    function off() {
      setPlaying(false);
      setPlayKind("");
    }
    window.addEventListener("halo-home-play", on);
    window.addEventListener("halo-home-play-end", off);
    return () => {
      window.removeEventListener("halo-home-play", on);
      window.removeEventListener("halo-home-play-end", off);
    };
  }, []);

  useLayoutEffect(() => {
    if (!playing) {
      setGrown(false);
      return;
    }
    if (soft) {
      setGrown(true);
      return;
    }
    setGrown(false);
    /* Match HomeBubbles GATHER_MS so family chips merge into the 3.6rem
       composer, then the sheet grows from that center. */
    const grow = window.setTimeout(() => setGrown(true), 720);
    return () => window.clearTimeout(grow);
  }, [playing, soft]);

  useEffect(() => {
    function sync() {
      const all = readKeepChips();
      setDueCount(all.filter(isDueChip).length);
      setKeptCount(
        all.filter((chip) => isBankedChip(chip) || isMasteredChip(chip)).length
      );
    }
    const id = window.setTimeout(sync, 0);
    const unsub = subscribeKeep(sync);
    return () => {
      window.clearTimeout(id);
      unsub();
    };
  }, []);

  useEffect(() => {
    if (dueCount === null) return;
    if (playing) return;
    const before = prevDue.current;
    prevDue.current = dueCount;
    if (
      before != null &&
      before > 0 &&
      dueCount === 0 &&
      keptCount > 0 &&
      !soft
    ) {
      setJustCleared(true);
      document.documentElement.dataset.haloCleared = "1";
      const id = window.setTimeout(() => {
        setJustCleared(false);
        delete document.documentElement.dataset.haloCleared;
      }, 1600);
      return () => {
        window.clearTimeout(id);
        delete document.documentElement.dataset.haloCleared;
      };
    }
  }, [dueCount, keptCount, playing, soft]);

  useLayoutEffect(() => {
    const el = composeRef.current;
    if (!el) return;
    const node = el;
    function save() {
      if (node.dataset.morph === "moving") return;
      rememberHeroCompose(node);
    }
    save();
    const id = window.setTimeout(save, COMPOSE_TRAVEL_MS + 80);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (shell?.active || soft) {
      if (soft) setLocalEntering(false);
      return;
    }
    const id = window.setTimeout(() => setLocalEntering(false), COMPOSE_TRAVEL_MS);
    return () => window.clearTimeout(id);
  }, [shell?.active, soft]);

  useEffect(() => {
    setChats(conversations);
  }, [conversations]);

  useEffect(() => {
    void import("@/components/ChatThread");
    const latest = conversations[0]?.id;
    if (latest) router.prefetch(`/ask/${latest}`);
  }, [router, conversations]);

  useEffect(() => {
    const tz = resolveUserTimeZone(profile?.timeZone);
    rememberUserTimeZone(tz);
    setTimeZone(tz);
    setMounted(true);
  }, [profile?.timeZone]);

  useEffect(() => {
    if (demo) return;
    const tz = resolveUserTimeZone(profile?.timeZone);
    void fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeZone: tz }),
    });
  }, [demo, profile?.timeZone]);

  useEffect(() => {
    if (demo || !profile || profile.onboarded) return;
    void fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboarded: true }),
    });
  }, [demo, profile]);

  const heroGreet = !mounted
    ? ""
    : justCleared || shouldShowClearGreeting()
      ? "You're clear"
      : timeGreeting(undefined, timeZone);

  const chips = useMemo(
    () => {
      const source =
        initialChips ??
        suggestChips(chats.map((c) => c.title));
      return source.map((chip) => ({
        id: chip.id,
        title: chip.label,
        prompt: chip.prompt,
      }));
    },
    [chats, initialChips]
  );

  const query = draft.trim();

  useEffect(() => {
    if (!composeOpen || query) {
      setIdleReady(false);
      return;
    }
    if (coarse) {
      setIdleReady(false);
      return;
    }
    const wait = soft ? 0 : IDLE_MS;
    const id = window.setTimeout(() => setIdleReady(true), wait);
    return () => window.clearTimeout(id);
  }, [composeOpen, query, soft, coarse]);

  const hints = useMemo(() => {
    if (query) {
      if (filled) return [];
      const n = coarse ? 2 : TYPE_COUNT;
      return matchPrompts(query, n).map((title, i) => ({
        id: `a${i}`,
        title,
      }));
    }
    // Phone keyboard eats the idle list. Skip it so the first tap focuses.
    if (coarse) return [];
    if (!composeOpen || !idleReady) return [];
    const used = new Set<string>();
    const out: { id: string; title: string }[] = [];
    for (const chip of chips) {
      const title = chip.title.trim();
      if (!title || used.has(title)) continue;
      used.add(title);
      out.push({ id: chip.id, title });
      if (out.length >= IDLE_COUNT) return out;
    }
    const daySeed = Math.floor(Date.now() / 86_400_000);
    for (const title of topIdlePrompts(IDLE_COUNT, daySeed)) {
      if (used.has(title)) continue;
      used.add(title);
      out.push({ id: `t${out.length}`, title });
      if (out.length >= IDLE_COUNT) break;
    }
    return out;
  }, [chips, composeOpen, filled, idleReady, query, coarse]);

  useEffect(() => {
    setActiveHint(0);
  }, [hints]);

  function composeEl() {
    return shell?.active ? shell.composeRef.current : composeRef.current;
  }

  function focusComposeField() {
    window.clearTimeout(composeFocus.current);
    setComposeOpen(true);
    window.requestAnimationFrame(() => {
      composeEl()?.querySelector("textarea")?.focus({ preventScroll: true });
    });
  }

  function fillDraft(title: string) {
    setDraft(title);
    setFilled(true);
    setComposeOpen(true);
    setActiveHint(0);
    window.requestAnimationFrame(() => {
      composeEl()?.querySelector("textarea")?.focus({ preventScroll: true });
    });
  }

  function pushAsk(href: string) {
    const root = document.documentElement;
    const keyboard = root.dataset.haloNative === "1" && root.dataset.haloKb === "1";
    const go = () => {
      leaving.current = false;
      const before = window.location.pathname;
      router.push(href);
      window.setTimeout(() => {
        if (window.location.pathname === before) window.location.assign(href);
      }, 700);
    };
    if (!keyboard) {
      go();
      return;
    }
    delete root.dataset.haloKb;
    delete root.dataset.haloKbFade;
    root.style.setProperty("--kb-inset", "0px");
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.setTimeout(go, 360);
  }

  function goAfterLeave(run: () => void | Promise<void>) {
    // The phone web view freezes if Home starts the 1080ms leave and then
    // navigates. Chips and Settings stay on this page, so they still work.
    if (document.documentElement.dataset.haloNative === "1") {
      leaving.current = false;
      void run();
      return;
    }
    // A leave already in flight used to return here and leave Home on
    // "Asking…" forever. The timer still performs this navigation once.
    let ran = false;
    const once = async () => {
      if (ran) return;
      ran = true;
      await run();
    };
    window.setTimeout(() => {
      void once();
    }, COMPOSE_TRAVEL_MS + 280);
    if (leaving.current) return;
    if (playing) {
      window.dispatchEvent(new Event("halo-home-play-end"));
      setPlaying(false);
      setGrown(false);
      setPlayKind("");
      clearComposeHandoff();
      void once();
      return;
    }
    if (soft) {
      setDraft("");
      void once();
      return;
    }
    if (shell?.active) {
      leaving.current = true;
      shell.leaveToChat(async () => {
        await once();
        leaving.current = false;
      });
      return;
    }
    leaving.current = true;
    stageRef.current?.classList.add("is-leaving");
    rememberHeroCompose(composeRef.current);
    travelComposeTowardDock(composeRef.current);
    window.setTimeout(() => {
      pinComposeGhost(composeRef.current);
      captureComposeMorph(composeRef.current);
      void once();
    }, COMPOSE_TRAVEL_MS);
  }

  function abortLeave(message: string) {
    leaving.current = false;
    stageRef.current?.classList.remove("is-leaving");
    if (shell?.active) {
      abortAskShellTravel();
    } else {
      resetComposeTravel(composeRef.current);
    }
    abortPendingTurn();
    setSending(false);
    setError(message);
  }

  async function startAsk(text: string, fromEl?: HTMLElement | null) {
    const message = text.trim();
    if ((!message && files.length === 0) || sending) return;

    setListening(false);
    setSending(true);
    setError(null);
    setComposeOpen(false);
    if (document.documentElement.dataset.haloNative !== "1") {
      composeRef.current?.querySelector("textarea")?.blur();
    }

    if (demo || isLabPreviewPath()) {
      window.dispatchEvent(new Event("halo-home-play-end"));
      setPlaying(false);
      setGrown(false);
      setPlayKind("");
      goAfterLeave(() => {
        router.replace(labPreviewChatHref());
        setSending(false);
      });
      return;
    }

    if (document.documentElement.dataset.haloNative === "1") {
      try {
        const attachments = files.length ? await readAttachments(files) : [];
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: message || undefined,
            attachments,
            timeZone: resolveUserTimeZone(profile?.timeZone),
            prepareOnly: true,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            (data as { error?: string }).error || "Failed to send"
          );
        }
        const data = (await res.json()) as { conversationId?: string };
        const conversationId =
          res.headers.get(HALO_CONVERSATION_HEADER) || data.conversationId;
        if (!conversationId) throw new Error("Failed to send");
        stashAskAttachments(conversationId, attachments);
        sessionStorage.setItem(`halo-ask-live:${conversationId}`, "1");
        pushAsk(`/ask/${conversationId}`);
      } catch (err) {
        abortLeave(err instanceof Error ? err.message : "Something went wrong");
      }
      return;
    }

    // One stream during the 1080ms travel: create the chat, classify, and
    // start tokens. Chat only attaches — it does not classify again.
    const prepWork = (async () => {
      const attachments = files.length ? await readAttachments(files) : [];
      const abort = new AbortController();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          message: message || undefined,
          attachments,
          timeZone: resolveUserTimeZone(profile?.timeZone),
        }),
        signal: abort.signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error || "Failed to send"
        );
      }
      const conversationId = res.headers.get(HALO_CONVERSATION_HEADER);
      if (!conversationId) {
        throw new Error("Failed to send");
      }
      stashAskAttachments(conversationId, attachments);
      sessionStorage.setItem(`halo-ask-live:${conversationId}`, "1");
      router.prefetch(`/ask/${conversationId}`);
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/event-stream")) {
        armPendingStream(conversationId, res, abort);
      } else {
        abort.abort();
      }
      return conversationId;
    })();

    goAfterLeave(async () => {
      try {
        router.push(`/ask/${await prepWork}`);
      } catch (err) {
        abortLeave(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await startAsk(draft);
  }

  useEffect(() => {
    if (!shell?.active) return;
    shell.setHomeUi({
      hints,
      activeHint,
      setActiveHint,
      onPickHint: fillDraft,
      onFillDraft: fillDraft,
      composeOpen,
      onFocusField: focusComposeField,
      onBlurField: () => {
        composeFocus.current = window.setTimeout(() => setComposeOpen(false), 180);
      },
      onKeyDown: (event) => {
        if (!hints.length) return;
        if (event.key === "Tab" && !event.shiftKey) {
          event.preventDefault();
          fillDraft(hints[activeHint]?.title ?? hints[0].title);
          return;
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setActiveHint((n) => (n + 1) % hints.length);
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setActiveHint((n) => (n - 1 + hints.length) % hints.length);
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          setComposeOpen(false);
        }
      },
      playing,
      playKind,
      grown,
      playSlot: playing ? (
        <div className="compose-play-root" data-halo-play-root />
      ) : undefined,
      suggestOpen: hints.length > 0 && !playing,
    });
    return () => shell.setHomeUi(null);
  }, [
    shell,
    hints,
    activeHint,
    composeOpen,
    playing,
    playKind,
    grown,
    fillDraft,
    focusComposeField,
  ]);

  useEffect(() => {
    if (!shell?.active) return;
    shell.setSubmitHandler((event) => onSubmit(event));
    return () => shell.setSubmitHandler(null);
  }, [shell, onSubmit]);

  function openChat(id: string) {
    if (demo || isLabPreviewPath()) {
      window.dispatchEvent(new Event("halo-home-play-end"));
      setPlaying(false);
      setGrown(false);
      setPlayKind("");
      clearComposeHandoff();
      router.replace(labPreviewChatHref(id));
      return;
    }
    captureComposeMorph(composeRef.current);
    if (document.documentElement.dataset.haloNative === "1") {
      pushAsk(`/ask/${id}`);
      return;
    }
    goAfterLeave(() => {
      router.push(`/ask/${id}`);
    });
  }

  return (
    <div className={`ask-stage${entering ? " is-entering" : ""}${playing ? " is-playing" : ""}`} ref={stageRef}>
      <HaloHeader
        conversations={chats.map((c) => ({ id: c.id, title: c.title }))}
        demo={demo}
        homeHref={demo ? "/preview" : "/ask"}
        profile={profile}
        onOpenChat={openChat}
        onDeleted={(id) =>
          setChats((prev) => prev.filter((chat) => chat.id !== id))
        }
      />

      <HomeBubbles
        demo={demo}
        white={[]}
        onAsk={(item, el) => {
          void startAsk(item.prompt, el);
        }}
        onOpenSource={(chip) => {
          window.dispatchEvent(new Event("halo-home-play-end"));
          setPlaying(false);
          setGrown(false);
          setPlayKind("");
          if (demo || isLabPreviewPath()) {
            goAfterLeave(() => {
              router.replace(labPreviewChatHref("1"));
            });
            return;
          }
          const dest = chip.askId?.trim();
          if (!dest || /^[1-6]$/.test(dest)) return;
          if (document.documentElement.dataset.haloNative === "1") {
            pushAsk(`/ask/${dest}`);
            return;
          }
          goAfterLeave(() => {
            router.push(`/ask/${dest}`);
          });
        }}
      />

      <main className="ask-hero">
        <SpringStage variant="hero">
          <p
            className={`ask-greeting${justCleared ? " is-clear" : ""}`}
            suppressHydrationWarning
          >
            {mounted
              ? `${justCleared ? "You're clear" : heroGreet}, ${displayName}`
              : "\u00a0"}
          </p>
          <div
            className={`compose-stack${hints.length && !playing ? " is-open" : ""}${
              shell?.active ? " compose-stack--phantom" : ""
            }`}
            onPointerDown={(event) => {
              if (shell?.active || playing) return;
              const target = event.target as HTMLElement;
              if (
                target.closest(".compose-actions") ||
                target.closest(".compose-suggest") ||
                target.closest("button")
              ) {
                return;
              }
              focusComposeField();
            }}
          >
          {shell?.active ? null : (
          <>
          <ComposeStadium
            className={`compose${playing ? " is-play-lesson" : ""}${
              playing && grown ? " is-grown" : ""
            }`}
            kind={playing && playKind ? playKind : undefined}
            elementRef={composeRef}
            listening={listening}
            style={{ "--enter-delay": "90ms" } as React.CSSProperties}
          >
            {playing ? (
              <div className="compose-play-root" data-halo-play-root />
            ) : (
            <form onSubmit={onSubmit} className="compose-form">
              {error ? <p className="form-error">{error}</p> : null}
              <AttachList
                files={files}
                onRemove={(file) =>
                  setFiles((prev) => prev.filter((f) => f !== file))
                }
              />
              <label className="sr-only" htmlFor="mind">
                What’s on your mind?
              </label>
              <div className="compose-row">
                <ComposeField
                  id="mind"
                  placeholder="What’s on your mind?"
                  value={draft}
                  onValueChange={(value) => {
                    setFilled(false);
                    setDraft(value);
                  }}
                  disabled={sending}
                  onFocus={() => {
                    window.clearTimeout(composeFocus.current);
                    setComposeOpen(true);
                  }}
                  onBlur={() => {
                    composeFocus.current = window.setTimeout(
                      () => setComposeOpen(false),
                      180
                    );
                  }}
                  onKeyDown={(event) => {
                    if (!hints.length) return;
                    if (event.key === "Tab" && !event.shiftKey) {
                      event.preventDefault();
                      fillDraft(hints[activeHint]?.title ?? hints[0].title);
                      return;
                    }
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setActiveHint((n) => (n + 1) % hints.length);
                      return;
                    }
                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setActiveHint((n) => (n - 1 + hints.length) % hints.length);
                      return;
                    }
                    if (event.key === "Escape") {
                      event.preventDefault();
                      setComposeOpen(false);
                    }
                  }}
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
                    {sending ? "Asking…" : "Ask"}
                  </WaterAction>
                </div>
              </div>
            </form>
            )}
          </ComposeStadium>
          {playing ? null : (
          <ComposeSuggest
            key={query ? "type" : "idle"}
            items={hints}
            active={activeHint}
            onPick={fillDraft}
            onActive={setActiveHint}
          />
          )}
          </>
          )}
          </div>
        </SpringStage>
      </main>
    </div>
  );
}
