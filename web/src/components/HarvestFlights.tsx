"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { WaterCapsule } from "@/components/WaterCapsule";
import { keepLandBox } from "@/lib/keep-land";
import type { HarvestChip } from "@/lib/harvest";
import {
  harvestStyleFromDom,
  type HarvestFlight,
} from "@/lib/harvest-style";

type Flight = {
  chip: HarvestChip;
  from: { x: number; y: number };
  index: number;
  delay: number;
};

export function HarvestFlights({
  chips,
  reduced,
  onLanded,
}: {
  chips: HarvestChip[];
  reduced: boolean;
  onLanded: (chip: HarvestChip) => void;
}) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    if (!chips.length) {
      seen.current.clear();
      setFlights([]);
      return;
    }
    const pending = chips.filter((chip) => !seen.current.has(chip.id));
    if (!pending.length) return;

    let frame = 0;
    let tries = 0;
    const attempt = () => {
      const fresh = pending.filter((chip) => !seen.current.has(chip.id));
      if (!fresh.length) return;

      const next: Flight[] = [];
      const waiting: HarvestChip[] = [];
      const instant: HarvestChip[] = [];
      for (const chip of fresh) {
        if (reduced) {
          instant.push(chip);
          continue;
        }
        const from = harvestMarkOrigin(chip);
        if (!from && tries < 36) {
          waiting.push(chip);
          continue;
        }
        next.push({
          chip,
          from: from ?? fallbackHarvestOrigin(next.length),
          index: next.length,
          delay: next.length * 200,
        });
      }

      if (waiting.length) {
        tries += 1;
        frame = window.requestAnimationFrame(attempt);
        return;
      }

      for (const flight of next) seen.current.add(flight.chip.id);
      for (const chip of instant) seen.current.add(chip.id);
      for (const chip of instant) onLanded(chip);
      if (next.length) setFlights((prev) => [...prev, ...next]);
    };

    frame = window.requestAnimationFrame(attempt);
    return () => window.cancelAnimationFrame(frame);
  }, [chips, reduced, onLanded]);

  if (!flights.length) return null;

  return createPortal(
    <>
      {flights.map((flight) => (
        <FlyingOrb
          key={flight.chip.id}
          flight={flight}
          onDone={(hit) => {
            window.dispatchEvent(
              new CustomEvent("halo-keep-land", {
                detail: { ...flight.chip, x: hit.x, y: hit.y },
              })
            );
            onLanded(flight.chip);
            setFlights((prev) => prev.filter((f) => f.chip.id !== flight.chip.id));
          }}
        />
      ))}
    </>,
    document.body
  );
}

function FlyingOrb({
  flight,
  onDone,
}: {
  flight: Flight;
  onDone: (hit: { x: number; y: number }) => void;
}) {
  const style = harvestStyleFromDom();
  const nodeRef = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  const onDoneRef = useRef(onDone);
  const flightKind = style.flight;

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    let frame = 0;
    let lastPose = 0;
    const wait = window.setTimeout(() => {
      const el = nodeRef.current;
      const box = keepLandBox();
      const pond = document.querySelector("[data-keep-pond]");
      const pondBox = pond?.getBoundingClientRect();
      const to = box
        ? { x: box.left + box.width / 2, y: box.top + box.height / 2 }
        : {
            x: pondBox ? pondBox.left + pondBox.width * 0.58 : window.innerWidth * 0.62,
            y: pondBox ? pondBox.top + pondBox.height * 0.5 : 36,
          };
      const duration = durationFor(flightKind);
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const poseNow = samplePath(flightKind, flight.from, to, flight.index, t);
        if (el) {
          el.style.left = `${poseNow.x}px`;
          el.style.top = `${poseNow.y}px`;
          el.style.opacity = String(poseNow.opacity);
          el.style.transform = `translate(-50%, -50%) scale(${poseNow.scale})`;
        }
        if (t === 1 || now - lastPose > 48) {
          lastPose = now;
          window.dispatchEvent(
            new CustomEvent("halo-harvest-pose", {
              detail: {
                id: flight.chip.id,
                index: flight.index,
                t,
                x: poseNow.x,
                y: poseNow.y,
                scale: poseNow.scale,
                opacity: poseNow.opacity,
              },
            })
          );
        }
        if (t < 1) {
          frame = window.requestAnimationFrame(tick);
          return;
        }
        if (!done.current) {
          done.current = true;
          onDoneRef.current(to);
        }
      };
      frame = window.requestAnimationFrame(tick);
    }, flight.delay);

    return () => {
      window.clearTimeout(wait);
      window.cancelAnimationFrame(frame);
    };
  }, [flight, flightKind]);

  return (
    <div
      ref={nodeRef}
      className={`harvest-fly harvest-fly--${style.shape}`}
      style={{
        left: flight.from.x,
        top: flight.from.y,
        transform: "translate(-50%, -50%)",
      }}
    >
      <WaterCapsule
        kind={flight.chip.kind}
        still
        className={`capsule--harvest capsule--harvest-${style.shape}`}
        phase={0}
        title=""
      />
    </div>
  );
}

function harvestMarkOrigin(chip: HarvestChip) {
  const id =
    typeof CSS !== "undefined" && "escape" in CSS
      ? CSS.escape(chip.id)
      : chip.id.replace(/"/g, "");
  const mark = document.querySelector(`[data-harvest="${id}"]`);
  const box = mark?.getBoundingClientRect();
  if (!box || box.width < 2) return null;
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
}

function fallbackHarvestOrigin(index: number) {
  const bubble =
    document.querySelector('[data-harvest-origin="true"] .answer') ??
    document.querySelector(".msg-wrap--assistant:last-of-type .answer") ??
    document.querySelector(".chat-scroll");
  const box = bubble?.getBoundingClientRect();
  if (box && box.height >= 2) {
    return {
      x: box.left + box.width * 0.5 + index * 24,
      y: box.top + Math.min(box.height * 0.35, 48),
    };
  }
  return {
    x: window.innerWidth * 0.5 + index * 24,
    y: window.innerHeight * 0.42,
  };
}

function durationFor(flight: HarvestFlight) {
  if (flight === "burst") return 1680;
  if (flight === "float") return 1240;
  return 980;
}

function easeOut(t: number) {
  return 1 - (1 - t) ** 3;
}

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function cubic(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
  d: { x: number; y: number },
  t: number
) {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  };
}

function absorb(t: number) {
  if (t < 0.8) return { scale: 1, opacity: 1 };
  const u = (t - 0.8) / 0.2;
  const k = u * u;
  return { scale: lerp(1, 0.08, k), opacity: lerp(1, 0, k) };
}

function samplePath(
  flight: HarvestFlight,
  from: { x: number; y: number },
  to: { x: number; y: number },
  index: number,
  t: number
) {
  const end = absorb(t);

  if (flight === "rise") {
    const u = easeInOut(t);
    return {
      x: lerp(from.x, to.x, u),
      y: lerp(from.y, to.y, u),
      ...end,
    };
  }

  if (flight === "float") {
    const u = easeInOut(t);
    const lift = -Math.min(90, Math.abs(to.y - from.y) * 0.35 + 36);
    return {
      x: lerp(from.x, to.x, u),
      y: lerp(from.y, to.y, u) + lift * Math.sin(Math.PI * u),
      scale: end.scale,
      opacity: end.opacity,
    };
  }

  const away = from.x < to.x ? -1 : 1;
  const side = index % 2 === 0 ? away : -away;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const pad = 20;
  const room = Math.max(40, Math.min(236 + index * 28, vw * 0.22));
  const p1 = {
    x: clamp(from.x + side * Math.min(78, room * 0.4), pad, vw - pad),
    y: from.y - 40,
  };
  const p2 = {
    x: clamp(from.x + side * room, pad, vw - pad),
    y: from.y - (92 + index * 14),
  };
  const u =
    t < 0.62
      ? smooth(t / 0.62) * 0.5
      : 0.5 + smooth((t - 0.62) / 0.38) * 0.5;
  const p = cubic(from, p1, p2, to, u);
  const swell = t < 0.22 ? lerp(0.94, 1.06, easeOut(t / 0.22)) : 1.06;
  return {
    x: p.x,
    y: p.y,
    scale: end.scale * swell,
    opacity: end.opacity,
  };
}

