"use client";

import { toJpeg } from "html-to-image";
import { useEffect, useRef, useState } from "react";
import { harvestStyleFromDom } from "@/lib/harvest-style";
import { scoreHarvest, type HarvestCheck, type HarvestPoseSample } from "@/lib/harvest-score";

export type CaptureSink = "mac-sink" | "local-api" | "none";

const SINK = "http://127.0.0.1:8791/harvest-capture";
const RECORD_MAX_MS = 180000;
const STILL_EVERY_MS = 2000;
const MAX_STILLS = 90;

async function snapStage() {
  return toJpeg(document.body, {
    quality: 0.52,
    pixelRatio: 1,
    cacheBust: false,
    skipFonts: true,
    canvasWidth: 720,
    filter: (el) => {
      if (!(el instanceof HTMLElement)) return true;
      return (
        !el.classList.contains("preview-switcher") &&
        !el.classList.contains("harvest-overlay")
      );
    },
  });
}

function pathJpeg(samples: HarvestPoseSample[]) {
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
  const groups = new Map<string, HarvestPoseSample[]>();
  for (const sample of samples) {
    const list = groups.get(sample.id) ?? [];
    list.push(sample);
    groups.set(sample.id, list);
  }
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const colors = ["#7ad4c4", "#f0c36a", "#c9a0e8"];
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

export function HarvestCapture({
  film,
  onScore,
}: {
  film: boolean;
  onScore?: (info: {
    checks: HarvestCheck[];
    fps: number;
    sink: CaptureSink;
    dir?: string;
  }) => void;
}) {
  const [live, setLive] = useState({ fps: 0, t: 0, recording: false });
  const samples = useRef<HarvestPoseSample[]>([]);
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
        let lastStill = 0;
        const tick = (now: number) => {
          rafCount += 1;
          const t = now - started;
          if (now - lastUi > 200) {
            lastUi = now;
            setLive((prev) => ({ ...prev, t }));
          }
          if (wantFilm && t - lastStill >= STILL_EVERY_MS) {
            lastStill = t;
            grab("tick");
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
      const checks = scoreHarvest(samples.current);
      const fps = Math.round(rafCount / Math.max(1, elapsed / 1000));
      const meta = {
        at: new Date().toISOString(),
        style: harvestStyleFromDom(),
        durationMs: elapsed,
        frameCount: stills.length,
        sampleCount: samples.current.length,
        fps,
        film: wantFilm,
        checks,
      };
      const saved = await postCapture({ meta, frames: stills });
      onScoreRef.current?.({ checks, fps, sink: saved.sink, dir: saved.dir });
      setLive({ fps, t: elapsed, recording: false });
      busy.current = false;
    }

    function onBegin() {
      void record();
    }
    function onStop() {
      stopRef.current = true;
    }
    function onPose(event: Event) {
      const detail = (event as CustomEvent<Omit<HarvestPoseSample, "at">>).detail;
      if (!detail) return;
      samples.current.push({ ...detail, at: performance.now() });
    }

    window.addEventListener("halo-harvest-replay", onBegin);
    window.addEventListener("halo-harvest-stop", onStop);
    window.addEventListener("halo-harvest-pose", onPose);
    return () => {
      window.removeEventListener("halo-harvest-replay", onBegin);
      window.removeEventListener("halo-harvest-stop", onStop);
      window.removeEventListener("halo-harvest-pose", onPose);
    };
  }, []);

  if (!live.recording) return null;
  return (
    <p className="harvest-overlay" aria-live="polite">
      Recording {Math.max(1, Math.round(live.t / 1000))}s
    </p>
  );
}
