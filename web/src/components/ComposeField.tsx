"use client";

import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";
import { handleComposeKeyDown } from "@/lib/compose-keys";

const MAX_PX = 280;

export function ComposeField({
  value,
  onValueChange,
  ...props
}: {
  value: string;
  onValueChange: (value: string) => void;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_PX)}px`;
  }, [value]);

  return (
    <textarea
      {...props}
      ref={ref}
      className={`field ${props.className ?? ""}`}
      rows={1}
      spellCheck={props.spellCheck ?? false}
      autoCorrect={props.autoCorrect ?? "off"}
      autoCapitalize={props.autoCapitalize ?? "off"}
      autoComplete={props.autoComplete ?? "off"}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      onKeyDown={(e) => {
        props.onKeyDown?.(e);
        if (!e.defaultPrevented) handleComposeKeyDown(e);
      }}
    />
  );
}
