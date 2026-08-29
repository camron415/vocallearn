"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ChipKind } from "@/lib/harvest";

export type LoopFlight = {
  id: string;
  chipId?: string;
  token: string;
  kind: ChipKind;
  mode: "bank" | "drop";
  from: { x: number; y: number; w: number; h: number };
  to: { x: number; y: number; w: number; h: number };
};

export function LoopFlights({
  flights,
  onDone,
}: {
  flights: LoopFlight[];
  onDone: (flight: LoopFlight) => void;
}) {
  if (typeof document === "undefined" || !flights.length) return null;
  return createPortal(
    <>
      {flights.map((flight) => (
        <LoopFlightChip key={flight.id} flight={flight} onDone={onDone} />
      ))}
    </>,
    document.body
  );
}

function LoopFlightChip({
  flight,
  onDone,
}: {
  flight: LoopFlight;
  onDone: (flight: LoopFlight) => void;
}) {
  const [go, setGo] = useState(false);
  const onDoneRef = useRef(onDone);
  const flightRef = useRef(flight);
  onDoneRef.current = onDone;
  flightRef.current = flight;

  useEffect(() => {
    const start = window.requestAnimationFrame(() => setGo(true));
    const done = window.setTimeout(() => onDoneRef.current(flightRef.current), 640);
    return () => {
      window.cancelAnimationFrame(start);
      window.clearTimeout(done);
    };
  }, [flight.id]);

  const box = go ? flight.to : flight.from;
  return (
    <span
      className={`loop-flight loop-flight--${flight.kind}${
        go ? " is-go" : ""
      }${flight.mode === "bank" ? " is-bank" : " is-drop"}`}
      style={{
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
      }}
    >
      {flight.mode === "drop" ? flight.token : null}
    </span>
  );
}
