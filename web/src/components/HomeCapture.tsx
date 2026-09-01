"use client";

import { toJpeg } from "html-to-image";
import { useEffect, useRef, useState } from "react";
import { homeStyleFromDom } from "@/lib/home-style";
import type { CaptureSink } from "@/components/HarvestCapture";

const SINK = "http://127.0.0.1:8791/harvest-capture";
const RECORD_MAX_MS = 180000;
const STILL_EVERY_MS = 2000;
const POSE_EVERY_MS = 80;
const MAX_STILLS = 90;

async function snapStage() {
  return toJpeg(document.body, {
    quality: 0.55,
    pixelRatio: 1,
    cacheBust: false,
    skipFonts: true,
    canvasWidth: 960,
    filter: (el) => {
      if (!(el instanceof HTMLElement)) return true;
      return (
        !el.classList.contains("preview-switcher") &&
        !el.classList.contains("harvest-overlay")
      );
    },
  });
}

type Pose = { id: string; x: number; y: number; at: number };

function pathJpeg(samples: Pose[]) {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 405;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = "#141416";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!samples.length) return canvas.toDataURL("image/jpeg", 0.85);
  const xs = samples.map((s) => s.x);
  const ys = samples.map((s) => s.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = 28;
  const sx = (canvas.width - pad * 2) / Math.max(8, maxX - minX);
  const sy = (canvas.height - pad * 2) / Math.max(8, maxY - minY);
  const scale = Math.min(sx, sy);
  const groups = new Map<string, Pose[]>();
  for (const sample of samples) {
    const list = groups.get(sample.id) ?? [];
    list.push(sample);
    groups.set(sample.id, list);
  }
  ctx.lineWidth = 2.4;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const colors = ["#7ad4c4", "#f0c36a", "#c9a0e8", "#8fd4a8", "#f5f5f7"];
  let i = 0;
  for (const list of groups.values()) {
    ctx.strokeStyle = colors[i % colors.length];
    ctx.beginPath();
    list.forEach((sample, index) => {
      const x = pad + (sample.x - minX) * scale;
      const y = pad + (sample.y - minY) * scale;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    i += 1;
  }
  return canvas.toDataURL("image/jpeg", 0.85);
}

function sampleChips(): Omit<Pose, "at">[] {
  return [...document.querySelectorAll(".home-bubbles .capsule")].map(
    (node, index) => {
      const r = (node as HTMLElement).getBoundingClientRect();
      return {
        id: (node as HTMLElement).textContent?.trim().slice(0, 24) || `c${index}`,
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
      };
    }
  );
}

function inTravel() {
  return !!(
    document.querySelector(".is-leaving") ||
    document.documentElement.dataset.haloMorph
  );
}

function overlapCount() {
  const boxes = [...document.querySelectorAll(".home-bubbles .capsule")].map(
    (node) => (node as HTMLElement).getBoundingClientRect()
  );
  let hits = 0;
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) {
        hits += 1;
      }
    }
  }
  return hits;
}

async function postCapture(body: unknown): Promise<{ sink: CaptureSink; dir?: string }> {
  try {
    const sink = await fetch(SINK, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (sink.ok) {
      const json = (await sink.json()) as { dir?: string };
      return { sink: "mac-sink", dir: json.dir };
    }
  } catch {
    /* sink not running */
  }
  try {
    const local = await fetch("/api/dev/capture", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (local.ok) {
      const json = (await local.json()) as { dir?: string };
      return { sink: "local-api", dir: json.dir };
    }
  } catch {
    /* not local next */
  }
  return { sink: "none" };
}

export function HomeCapture({
  film,
  onScore,
}: {
  film: boolean;
  onScore?: (info: {
    fps: number;
    overlaps: number;
    chips: number;
    sink: CaptureSink;
    dir?: string;
  }) => void;
}) {
  const [live, setLive] = useState({ fps: 0, t: 0, recording: false });
  const samples = useRef<Pose[]>([]);
  const onScoreRef = useRef(onScore);
  const filmRef = useRef(film);
  const busy = useRef(false);
  const stopRef = useRef(false);
  onScoreRef.current = onScore;
  filmRef.current = film;

  useEffect(() => {
    async function record() {
      if (busy.current) return;
      busy.current = true;
      stopRef.current = false;
      samples.current = [];
      setLive({ fps: 0, t: 0, recording: true });
      const started = performance.now();
      let rafCount = 0;
      const stills: { name: string; jpeg: string }[] = [];
      const wantFilm = filmRef.current;
      let extraStill = 0;
      const grabs: Promise<void>[] = [];
      function grab(name: string) {
        if (!wantFilm) return;
        if (extraStill >= MAX_STILLS) return;
        extraStill += 1;
        const stamp = `frame-${String(extraStill).padStart(2, "0")}-${name}`;
        grabs.push(
          snapStage()
            .then((jpeg) => {
              stills.push({ name: stamp, jpeg });
            })
            .catch(() => {})
        );
      }
      grab("start");

      await new Promise<void>((resolve) => {
        let lastUi = 0;
        let lastPose = 0;
        let lastStill = 0;
        let sawTravel = false;
        let travelAt = 0;
        let midA = false;
        let midB = false;
        const tick = (now: number) => {
          rafCount += 1;
          const t = now - started;
          if (now - lastPose >= POSE_EVERY_MS) {
            lastPose = now;
            sampleChips().forEach((chip) => {
              samples.current.push({ ...chip, at: now });
            });
          }
          if (now - lastUi > 200) {
            lastUi = now;
            setLive((prev) => ({ ...prev, t }));
          }
          if (wantFilm && t - lastStill >= STILL_EVERY_MS) {
            lastStill = t;
            grab("tick");
          }
          const traveling = inTravel();
          if (traveling && !sawTravel) {
            sawTravel = true;
            travelAt = now;
            grab("travel");
          }
          if (traveling && sawTravel) {
            if (!midA && now - travelAt > 360) {
              midA = true;
              grab("mid");
            }
            if (!midB && now - travelAt > 720) {
              midB = true;
              grab("late");
            }
          }
          if (!traveling && sawTravel) {
            grab("land");
            sawTravel = false;
            midA = false;
            midB = false;
          }
          if (stopRef.current || t >= RECORD_MAX_MS) {
            resolve();
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      grab("end");
      await Promise.all(grabs);
      stills.sort((a, b) => a.name.localeCompare(b.name));
      stills.unshift({ name: "path", jpeg: pathJpeg(samples.current) });
      const elapsed = Math.round(performance.now() - started);
      const fps = Math.round(rafCount / Math.max(1, elapsed / 1000));
      const overlaps = overlapCount();
      const chips = document.querySelectorAll(".home-bubbles .capsule").length;
      const meta = {
        surface: "home",
        at: new Date().toISOString(),
        style: homeStyleFromDom(),
        durationMs: elapsed,
        frameCount: stills.length,
        sampleCount: samples.current.length,
        fps,
        film: wantFilm,
        overlaps,
        chips,
      };
      const saved = await postCapture({ meta, frames: stills });
      onScoreRef.current?.({
        fps,
        overlaps,
        chips,
        sink: saved.sink,
        dir: saved.dir,
      });
      setLive({ fps, t: elapsed, recording: false });
      busy.current = false;
    }

    function onBegin() {
      void record();
    }
    function onStop() {
      stopRef.current = true;
    }
    window.addEventListener("halo-home-replay", onBegin);
    window.addEventListener("halo-home-stop", onStop);
    return () => {
      window.removeEventListener("halo-home-replay", onBegin);
      window.removeEventListener("halo-home-stop", onStop);
    };
  }, []);

  if (!live.recording) return null;
  return (
    <p className="harvest-overlay" aria-live="polite">
      Recording {Math.max(1, Math.round(live.t / 1000))}s
    </p>
  );
}
