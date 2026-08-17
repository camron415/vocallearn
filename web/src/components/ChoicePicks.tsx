"use client";

import { WaterCapsule } from "@/components/WaterCapsule";

export function ChoicePicks<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<readonly [T, string]>;
  label: string;
}) {
  return (
    <div className="choice-picks" role="radiogroup" aria-label={label}>
      {options.map(([option, word], i) => (
        <WaterCapsule
          key={option}
          phase={i}
          selected={value === option}
          className="capsule--choice"
          onClick={() => onChange(option)}
        >
          {word}
        </WaterCapsule>
      ))}
    </div>
  );
}
