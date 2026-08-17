"use client";

import { ChoicePicks } from "@/components/ChoicePicks";
import type { AnswerLength } from "@/lib/types";

const OPTIONS = [
  ["short", "Short"],
  ["medium", "Medium"],
  ["long", "Long"],
] as const;

export function LengthPicks({
  value,
  onChange,
  label = "Answer length",
}: {
  value: AnswerLength;
  onChange: (value: AnswerLength) => void;
  label?: string;
}) {
  return (
    <ChoicePicks
      value={value}
      onChange={onChange}
      options={OPTIONS}
      label={label}
    />
  );
}
