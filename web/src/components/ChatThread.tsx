"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnswerBody } from "@/components/AnswerBody";
import { AttachButton } from "@/components/AttachButton";
import { ComposeField } from "@/components/ComposeField";
import { DictateButton } from "@/components/DictateButton";
import { HaloHeader } from "@/components/HaloHeader";
import { HarvestFlights } from "@/components/HarvestFlights";
import { type HistoryItem } from "@/components/HistoryMenu";
import { MessageCopy } from "@/components/MessageCopy";
import { WorkTrace, type WorkStep } from "@/components/WorkTrace";
import { useEffectiveMotion } from "@/components/MotionProvider";
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
  type HarvestChip,
} from "@/lib/harvest";
import { readHaloStream, type HaloStreamEvent } from "@/lib/halo-stream";
import { isLabPreviewPath, labPreviewChatHref, labPreviewHomeHref } from "@/lib/lab-preview";
import { stripMarkdownForDisplay } from "@/lib/markdown-plain";
import { readAttachments } from "@/lib/read-files";
import type { AskMessage, HaloProfile } from "@/lib/types";

const RESUME_MS = 3 * 60 * 1000;
const generating = new Set<string>();

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
  profile,
}: {
  conversationId: string;
  title: string;
  initialMessages: AskMessage[];
  conversations?: HistoryItem[];
  homeHref?: string;
  demo?: boolean;
  profile?: HaloProfile;
}) {
  const router = useRouter();
  const soft = useEffectiveMotion() === "reduced";
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [freshIds, setFreshIds] = useState<Set<string>>(() => new Set());
  const [streamText, setStreamText] = useState("");
  const [workSteps, setWorkSteps] = useState<WorkStep[]>([]);
  const [thinking, setThinking] = useState("");
  const [showWork, setShowWork] = useState(false);
  const [chats, setChats] = useState(conversations);
  const [harvest, setHarvest] = useState<HarvestChip[]>([]);
  const [flying, setFlying] = useState<HarvestChip[]>([]);
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreTaken, setMoreTaken] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const turnStartRef = useRef<HTMLDivElement | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const leaving = useRef(false);
  const [exit, setExit] = useState(false);
  const resumeLock = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const bufferRef = useRef("");
  const flushTimer = useRef<number | null>(null);
  const demoHarvested = useRef(false);

  const landChip = useCallback((chip: HarvestChip) => {
    window.dispatchEvent(new CustomEvent("halo-keep-add", { detail: chip }));
  }, []);

  function beginHarvest(chips: HarvestChip[]) {
    if (!chips.length) return;
    window.dispatchEvent(
      new CustomEvent("halo-harvest-begin", {
        detail: { count: chips.length },
      })
    );
    setHarvest((prev) => {
      const seen = new Set(prev.map((item) => item.id));
      return [...prev, ...chips.filter((chip) => !seen.has(chip.id))];
    });
    window.setTimeout(() => {
      setFlying((prev) => {
        const known = new Set(prev.map((item) => item.id));
        return [...prev, ...chips.filter((chip) => !known.has(chip.id))];
      });
    }, 360);
    setMoreOpen(true);
  }

  useComposeMorph(dockRef, !soft);

  function goHome() {
    if (leaving.current) return;
    const dest = demo || isLabPreviewPath() ? labPreviewHomeHref() : homeHref;
    if (soft) {
      pinComposeGhost(dockRef.current);
      captureComposeMorph(dockRef.current);
      router.replace(dest);
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
    setChats(conversations);
  }, [conversations]);

  function replayHarvest() {
    setHarvest([]);
    setFlying([]);
    setMoreOpen(false);
    window.dispatchEvent(new Event("halo-keep-reset"));
    window.setTimeout(() => beginHarvest(PREVIEW_HARVEST_CHIPS), 80);
  }

  useEffect(() => {
    if (!demo) return;
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
  }, [demo, messages]);

  useEffect(() => {
    if (!demo) return;
    function onReplay() {
      replayHarvest();
    }
    window.addEventListener("halo-harvest-replay", onReplay);
    return () => window.removeEventListener("halo-harvest-replay", onReplay);
  }, [demo]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "auto" });
  }, [conversationId]);

  useEffect(() => {
    if (!sending) return;
    turnStartRef.current?.scrollIntoView({
      block: "start",
      inline: "nearest",
      behavior: soft ? "auto" : "smooth",
    });
  }, [sending, soft]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (flushTimer.current != null) window.clearTimeout(flushTimer.current);
    };
  }, []);

  useEffect(() => {
    if (demo || resumeLock.current || sending) return;
    let live = false;
    try {
      const key = `halo-ask-live:${conversationId}`;
      live = sessionStorage.getItem(key) === "1";
      if (live) sessionStorage.removeItem(key);
    } catch {
      live = false;
    }
    if (!live && !shouldResume(initialMessages)) return;
    resumeLock.current = true;
    void runTurn({ resume: true });
    // First paint only — follow-ups go through onSubmit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (generating.has(conversationId)) return "fail";
    generating.add(conversationId);
    setSending(true);
    setError(null);
    setStreamText("");
    setWorkSteps([]);
    setThinking("");
    setShowWork(false);
    bufferRef.current = "";

    const workTimer = window.setTimeout(() => setShowWork(true), 450);

    if (demo) {
      try {
        await playDemo();
        return "ok";
      } finally {
        window.clearTimeout(workTimer);
        setSending(false);
        setShowWork(false);
        setStreamText("");
        setWorkSteps([]);
        setThinking("");
        generating.delete(conversationId);
      }
    }

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;
    let result: "ok" | "blocked" | "fail" = "fail";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          conversationId,
          message: opts.text,
          resume: opts.resume || undefined,
          attachments: opts.attachments,
        }),
        signal: abort.signal,
      });

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok) {
        result = "blocked";
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error || "Failed to send"
        );
      }

      if (!contentType.includes("text/event-stream")) {
        const data = await res.json();
        const reply = data.reply as AskMessage;
        markFresh(reply.id);
        setMessages((prev) => [...prev, reply]);
        result = "ok";
        return "ok";
      }

      await readHaloStream(
        res,
        (event) => {
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
          handleLive(event);
        },
        abort.signal
      );
      return result;
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return "fail";
      setError(err instanceof Error ? err.message : "Something went wrong");
      return result === "blocked" ? "blocked" : "fail";
    } finally {
      window.clearTimeout(workTimer);
      flushBuffer(true);
      setSending(false);
      setStreamText("");
      setWorkSteps([]);
      setThinking("");
      setShowWork(false);
      generating.delete(conversationId);
    }
  }

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

  const lastUserId = [...messages].reverse().find((row) => row.role === "user")?.id;

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
          captureComposeMorph(dockRef.current);
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
              >
                <div
                  className={`msg msg--${m.role}${
                    freshIds.has(m.id) ? " msg--fresh" : ""
                  }`}
                >
                  {m.role === "assistant" ? (
                    <AnswerBody content={m.content} harvest={harvest} />
                  ) : (
                    <p>{stripMarkdownForDisplay(m.content)}</p>
                  )}
                  <MessageCopy content={m.content} />
                </div>
              </div>
            );
          })}
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
          {sending ? (
            <div className="msg-wrap msg-wrap--assistant">
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
                {streamText ? <MessageCopy content={streamText} /> : null}
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
      </SpringStage>

      <ComposeStadium className="compose compose-dock" elementRef={dockRef} listening={listening}>
        <form onSubmit={onSubmit} className="compose-form">
          {error ? <p className="form-error">{error}</p> : null}
          {files.length ? (
            <ul className="attach-list">
              {files.map((file) => (
                <li key={`${file.name}-${file.size}`}>
                  <span>{file.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFiles((prev) => prev.filter((f) => f !== file))
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
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
              />
              <DictateButton
                value={draft}
                onValueChange={setDraft}
                listening={listening}
                onListeningChange={setListening}
                disabled={sending}
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
      <HarvestFlights chips={flying} reduced={demo ? false : soft} onLanded={landChip} />
    </div>
  );
}
