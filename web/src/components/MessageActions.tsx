"use client";

import { useEffect, useState } from "react";
import { MessageCopy } from "@/components/MessageCopy";
import { messageCopyText } from "@/lib/markdown-plain";
import { listenAtom } from "@/lib/listen-atom";

function SpeakIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SavedIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function MessageSpeak({ content }: { content: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [pass, setPass] = useState<"atom" | "rest">("atom");
  const plain = messageCopyText(content).trim();
  const { atom, rest, truncated } = listenAtom(plain);

  useEffect(() => {
    setPass("atom");
    setSpeaking(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [plain]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!plain) return null;

  function speak(text: string, next: "atom" | "rest") {
    const utter = new SpeechSynthesisUtterance(text);
    utter.onend = () => {
      setSpeaking(false);
      setPass(next);
    };
    utter.onerror = () => {
      setSpeaking(false);
      setPass("atom");
    };
    setSpeaking(true);
    window.speechSynthesis.speak(utter);
  }

  function toggle() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setPass("atom");
      return;
    }
    window.speechSynthesis.cancel();
    if (pass === "rest" && rest) {
      speak(rest, "atom");
      return;
    }
    speak(atom || plain, truncated ? "rest" : "atom");
  }

  const idleTitle = truncated
    ? pass === "rest"
      ? "Listen to the rest"
      : "Listen to the first sentence"
    : "Listen";

  return (
    <button
      type="button"
      className={`stone-btn msg-action${speaking ? " is-copied" : ""}`}
      title={speaking ? "Stop" : idleTitle}
      aria-label={speaking ? "Stop reading" : idleTitle}
      onClick={toggle}
    >
      <SpeakIcon />
    </button>
  );
}

export function MessageActions({
  role,
  content,
  save,
  saveOrigin,
  onSave,
  onEdit,
}: {
  role: "user" | "assistant";
  content: string;
  save?: {
    status: "ready" | "saving" | "saved" | "error";
    error?: string;
  };
  saveOrigin?: string;
  onSave?: () => void;
  onEdit?: () => void;
}) {
  const copyable = Boolean(messageCopyText(content).trim());
  if (!copyable && !save && !onEdit) return null;

  return (
    <div className="chat-action-row">
      <div className="chat-action-chips">
        <MessageCopy content={content} />
        {role === "assistant" ? <MessageSpeak content={content} /> : null}
        {role === "user" && onEdit ? (
          <button
            type="button"
            className="stone-btn msg-action"
            title="Edit"
            aria-label="Edit"
            onClick={onEdit}
          >
            <EditIcon />
          </button>
        ) : null}
        {role === "assistant" && save && onSave ? (
          <button
            type="button"
            data-save-origin={saveOrigin}
            className={`stone-btn msg-action save-offer${
              save.status === "saved" ? " is-saved" : ""
            }`}
            disabled={save.status === "saving" || save.status === "saved"}
            title={
              save.status === "saved"
                ? "Saved"
                : save.status === "saving"
                  ? "Saving…"
                  : "Save this recipe"
            }
            aria-label={
              save.status === "saved"
                ? "Saved"
                : save.status === "saving"
                  ? "Saving"
                  : "Save this recipe"
            }
            onClick={onSave}
          >
            {save.status === "saved" ? <SavedIcon /> : <SaveIcon />}
          </button>
        ) : null}
      </div>
      {save?.status === "error" ? (
        <p className="save-offer-error">{save.error}</p>
      ) : null}
    </div>
  );
}
