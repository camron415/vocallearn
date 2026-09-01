"use client";

import { useState } from "react";
import { messageCopyText } from "@/lib/markdown-plain";

function CopyIcon() {
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
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function MessageCopy({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const plain = messageCopyText(content);
  if (!plain.trim()) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(plain);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <button
      type="button"
      className={`msg-copy${copied ? " is-copied" : ""}`}
      title={copied ? "Copied" : "Copy text"}
      aria-label={copied ? "Copied" : "Copy text"}
      onClick={() => void copy()}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}
