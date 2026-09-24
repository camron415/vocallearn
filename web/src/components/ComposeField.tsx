"use client";

import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";
import { handleComposeKeyDown } from "@/lib/compose-keys";
import { ASK_MESSAGE_MAX_CHARS } from "@/lib/limits";

const MAX_PX = 280;

export function ComposeField({
  value,
  onValueChange,
  maxLength = ASK_MESSAGE_MAX_CHARS,
  ...props
}: {
  value: string;
  onValueChange: (value: string) => void;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!value) {
      el.style.height = "";
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_PX)}px`;
  }, [value]);

  return (
    <textarea
      {...props}
      ref={ref}
      className={`field ${props.className ?? ""}`}
      rows={1}
      spellCheck={props.spellCheck ?? true}
      autoCorrect={props.autoCorrect ?? "on"}
      autoCapitalize={props.autoCapitalize ?? "sentences"}
      autoComplete={props.autoComplete ?? "on"}
      enterKeyHint={props.enterKeyHint ?? "send"}
      value={value}
      maxLength={maxLength}
      onChange={(e) => onValueChange(e.target.value.slice(0, maxLength))}
      onKeyDown={(e) => {
        props.onKeyDown?.(e);
        if (!e.defaultPrevented) handleComposeKeyDown(e);
      }}
    />
  );
}
