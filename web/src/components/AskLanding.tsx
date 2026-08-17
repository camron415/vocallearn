"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AttachButton } from "@/components/AttachButton";
import { BubbleField } from "@/components/BubbleField";
import { ComposeField } from "@/components/ComposeField";
import { DictateButton } from "@/components/DictateButton";
import { HaloHeader } from "@/components/HaloHeader";
import { HomeTour } from "@/components/HomeTour";
import { WelcomeGate } from "@/components/WelcomeGate";
import { useEffectiveMotion } from "@/components/MotionProvider";
import {
  SpringStage,
  captureComposeMorph,
  useComposeMorph,
} from "@/components/SpringStage";
import { WaterAction, WaterPane } from "@/components/WaterSurface";
import { suggestChips } from "@/lib/suggest-chips";
import { readAttachments } from "@/lib/read-files";
import type { AskConversation, HaloProfile } from "@/lib/types";

function greetingForHour(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function AskLanding({
  conversations,
  displayName,
  profile,
  demo = false,
}: {
  conversations: AskConversation[];
  displayName: string;
  profile?: HaloProfile;
  demo?: boolean;
}) {
  const router = useRouter();
  const soft = useEffectiveMotion() === "reduced";
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [welcome, setWelcome] = useState(!demo && profile && !profile.onboarded);
  const [tour, setTour] = useState(false);
  const [chats, setChats] = useState(conversations);
  const composeRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const leaving = useRef(false);

  useComposeMorph(composeRef, !soft);

  useEffect(() => {
    setChats(conversations);
  }, [conversations]);

  const chips = useMemo(
    () =>
      suggestChips(chats.map((c) => c.title)).map((chip) => ({
        id: chip.id,
        title: chip.label,
        prompt: chip.prompt,
      })),
    [chats]
  );

  function goAfterLeave(run: () => void) {
    if (leaving.current) return;
    if (soft) {
      run();
      return;
    }
    leaving.current = true;
    stageRef.current?.classList.add("is-leaving");
    window.setTimeout(run, 320);
  }

  async function startAsk(text: string, fromEl?: HTMLElement | null) {
    const message = text.trim();
    if ((!message && files.length === 0) || sending) return;

    setListening(false);
    setSending(true);
    setError(null);
    captureComposeMorph(fromEl ?? composeRef.current);

    if (demo) {
      goAfterLeave(() => {
        const next = new URLSearchParams(window.location.search);
        next.set("view", "chat");
        router.replace(`/preview?${next.toString()}`);
      });
      return;
    }

    try {
      const attachments = files.length ? await readAttachments(files) : [];
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message || undefined,
          attachments,
          prepareOnly: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send");
      }
      goAfterLeave(() => {
        sessionStorage.setItem(`halo-ask-live:${data.conversationId}`, "1");
        router.push(`/ask/${data.conversationId}`);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSending(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await startAsk(draft);
  }

  function openChat(id: string) {
    captureComposeMorph(composeRef.current);
    goAfterLeave(() => {
      if (demo) {
        const next = new URLSearchParams(window.location.search);
        next.set("view", "chat");
        router.replace(`/preview?${next.toString()}`);
        return;
      }
      router.push(`/ask/${id}`);
    });
  }

  return (
    <div className="ask-stage" ref={stageRef}>
      <HaloHeader
        conversations={chats.map((c) => ({ id: c.id, title: c.title }))}
        demo={demo}
        profile={profile}
        onOpenChat={openChat}
        onDeleted={(id) =>
          setChats((prev) => prev.filter((chat) => chat.id !== id))
        }
      />

      <div data-tour="bubbles">
        <BubbleField
          items={chips}
          onSelect={(item, el) => {
            void startAsk(item.prompt, el);
          }}
        />
      </div>

      <main className="ask-hero">
        <SpringStage variant="hero">
          <p className="ask-greeting">
            {greetingForHour()}, {displayName}
          </p>
          <WaterPane
            className="compose"
            elementRef={composeRef}
            listening={listening}
            style={{ "--enter-delay": "90ms" } as React.CSSProperties}
          >
            <form onSubmit={onSubmit} className="compose-form" data-tour="compose">
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
              <label className="sr-only" htmlFor="mind">
                What’s on your mind?
              </label>
              <div className="compose-row">
                <ComposeField
                  id="mind"
                  placeholder="What’s on your mind?"
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
                    {sending ? "Asking…" : "Ask"}
                  </WaterAction>
                </div>
              </div>
            </form>
          </WaterPane>
        </SpringStage>
      </main>

      {welcome ? (
        <WelcomeGate
          defaultName={displayName}
          onDone={() => {
            setWelcome(false);
            setTour(true);
          }}
        />
      ) : null}
      {tour ? <HomeTour onDone={() => setTour(false)} /> : null}
    </div>
  );
}
