"use client";

import { useEffect, useRef, useState } from "react";
import { WaterAction } from "@/components/WaterSurface";

type RecognitionCtor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: {
    resultIndex: number;
    results: ArrayLike<{
      isFinal: boolean;
      0: { transcript: string };
    }>;
  }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function DictateButton({
  value,
  onValueChange,
  listening,
  onListeningChange,
  disabled,
  onBlocked,
}: {
  value: string;
  onValueChange: (value: string) => void;
  listening: boolean;
  onListeningChange: (listening: boolean) => void;
  disabled?: boolean;
  onBlocked?: (message: string) => void;
}) {
  const [supported, setSupported] = useState(false);
  const recRef = useRef<InstanceType<RecognitionCtor> | null>(null);
  const baseRef = useRef(value);
  const listeningRef = useRef(listening);

  useEffect(() => {
    setSupported(Boolean(getRecognitionCtor()));
  }, []);

  useEffect(() => {
    listeningRef.current = listening;
  }, [listening]);

  useEffect(() => {
    return () => recRef.current?.stop();
  }, []);

  useEffect(() => {
    if (listening) return;
    recRef.current?.stop();
    recRef.current = null;
  }, [listening]);

  function stop() {
    recRef.current?.stop();
    recRef.current = null;
    onListeningChange(false);
  }

  function toggle() {
    if (disabled) return;
    if (listening) {
      stop();
      return;
    }

    const secure =
      window.isSecureContext ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1";
    if (!secure) {
      onBlocked?.(
        "Dictation needs HTTPS. On your phone use the lab deploy link, not the local Wi‑Fi address."
      );
      return;
    }

    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      onBlocked?.(
        "Voice dictation isn’t available in Safari on iPhone. Type instead, or try Chrome on a computer."
      );
      return;
    }

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    baseRef.current = value.trim();
    rec.onresult = (event) => {
      let finalChunk = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0]?.transcript ?? "";
        if (event.results[i].isFinal) finalChunk += piece;
        else interim += piece;
      }
      if (finalChunk) {
        baseRef.current = [baseRef.current, finalChunk.trim()]
          .filter(Boolean)
          .join(" ");
      }
      const next = [baseRef.current, interim.trim()].filter(Boolean).join(" ");
      onValueChange(next);
    };
    rec.onerror = () => stop();
    rec.onend = () => {
      if (listeningRef.current) onListeningChange(false);
      recRef.current = null;
    };
    recRef.current = rec;
    onListeningChange(true);
    rec.start();
  }

  return (
    <WaterAction
      type="button"
      className={`action-btn action-btn--icon dictate-btn${
        listening ? " is-listening" : ""
      }`}
      disabled={disabled}
      onClick={toggle}
    >
      <MicIcon />
      <span className="sr-only">
        {supported
          ? listening
            ? "Stop dictating"
            : "Dictate"
          : "Voice isn’t available in this browser"}
      </span>
    </WaterAction>
  );
}

function MicIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M12 14.5a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4.5a3 3 0 0 0 3 3Zm5-3a1 1 0 1 1 2 0 7 7 0 0 1-6 6.93V20h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-1.57A7 7 0 0 1 5 11.5a1 1 0 1 1 2 0 5 5 0 0 0 10 0Z"
      />
    </svg>
  );
}
