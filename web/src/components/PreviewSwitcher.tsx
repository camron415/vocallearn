"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";
import { HarvestCapture, type CaptureSink } from "@/components/HarvestCapture";
import { HomeCapture } from "@/components/HomeCapture";
import { clearComposeHandoff } from "@/components/SpringStage";
import {
  HOME_MIXER_HELP,
  HOME_STYLE_DEFAULT,
  clampKeepCount,
  readStoredHomeStyle,
  writeHomeStyle,
  type HomeInk,
  type HomeLamp,
  type HomePalette,
  type HomeSkin,
  type HomeStyle,
} from "@/lib/home-style";
import {
  MIXER_HELP,
  parseHarvestStyle,
  writeHarvestStyle,
  type HarvestDock,
  type HarvestFlight,
  type HarvestShape,
  type HarvestWake,
} from "@/lib/harvest-style";
import type { HarvestCheck } from "@/lib/harvest-score";
import {
  bankDue,
  clearKeepChips,
  dropKeepDue,
  gradeDue,
  masterDue,
  readLoopStats,
  seedKeepDemo,
  seedTutorialPack,
  spawnLabFact,
  subscribeKeep,
} from "@/lib/keep-memory";

const SCREENS = [
  { id: "home", label: "Home" },
  { id: "chat", label: "Chat" },
  { id: "join", label: "Invite" },
  { id: "login", label: "Login" },
] as const;

const SHAPES = [
  { id: "drop" as HarvestShape, label: "Drop" },
  { id: "orb" as HarvestShape, label: "Orb" },
  { id: "pill" as HarvestShape, label: "Pill" },
] as const;

const FLIGHTS = [
  { id: "burst" as HarvestFlight, label: "Burst" },
  { id: "float" as HarvestFlight, label: "Float" },
  { id: "rise" as HarvestFlight, label: "Rise" },
] as const;

const WAKES = [
  { id: "pebble" as HarvestWake, label: "Pebble" },
  { id: "glow" as HarvestWake, label: "Glow" },
  { id: "quiet" as HarvestWake, label: "Quiet" },
] as const;

const DOCKS = [
  { id: "count" as HarvestDock, label: "Count" },
  { id: "beads" as HarvestDock, label: "Beads" },
  { id: "words" as HarvestDock, label: "Words" },
  { id: "absorb" as HarvestDock, label: "Absorb" },
] as const;

const PALETTES = [
  { id: "glass" as HomePalette, label: "Glass" },
  { id: "match" as HomePalette, label: "Match" },
  { id: "wash" as HomePalette, label: "Wash" },
] as const;

const LAMPS = [
  { id: "off" as HomeLamp, label: "Off" },
  { id: "on" as HomeLamp, label: "On" },
] as const;

const INKS = [
  { id: "halo" as HomeInk, label: "Halo" },
  { id: "citrus" as HomeInk, label: "Citrus" },
  { id: "gummy" as HomeInk, label: "Gummy" },
  { id: "dusk" as HomeInk, label: "Dusk" },
] as const;

const SKINS = [
  { id: "ours" as HomeSkin, label: "Ours" },
  { id: "paper" as HomeSkin, label: "Paper" },
] as const;

export function PreviewSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const view = params.get("view");
  const screen =
    view === "chat" || view === "join" || view === "login" ? view : "home";
  const orb = params.get("orb");
  const fly = params.get("fly");
  const keepTint = params.get("keep");
  const dock = params.get("dock");
  const film = params.get("film") === "1";
  const style = parseHarvestStyle({
    get(name: string) {
      if (name === "orb") return orb;
      if (name === "fly") return fly;
      if (name === "keep") return keepTint;
      if (name === "dock") return dock;
      return null;
    },
  });
  const [score, setScore] = useState<{
    checks: HarvestCheck[];
    fps: number;
    sink: CaptureSink;
    dir?: string;
  } | null>(null);
  const [homeScore, setHomeScore] = useState<{
    fps: number;
    overlaps: number;
    chips: number;
    sink: CaptureSink;
    dir?: string;
  } | null>(null);
  const [sinkUp, setSinkUp] = useState(false);
  const [min, setMin] = useState(false);
  const [homeFilm, setHomeFilm] = useState(true);
  const [homeRec, setHomeRec] = useState(false);
  const [chatRec, setChatRec] = useState(false);
  const [home, setHome] = useState<HomeStyle>(HOME_STYLE_DEFAULT);
  const [loop, setLoop] = useState({
    due: 0,
    keep: 0,
    mastered: 0,
    total: 0,
    cap: 30,
  });

  useLayoutEffect(() => {
    document.documentElement.dataset.preview = "1";
    const stored = readStoredHomeStyle();
    const q = new URLSearchParams(window.location.search);
    const look = q.get("look");
    const theme = q.get("theme");
    const chipsQ = q.get("chips");
    if (theme === "dark" || theme === "light") {
      document.documentElement.setAttribute("data-halo-theme", theme);
    }
    const next = {
      ...stored,
      ...(look === "paper" || look === "ours" ? { skin: look as "paper" | "ours" } : {}),
      ...(chipsQ != null ? { keepCount: clampKeepCount(chipsQ) } : {}),
    };
    setHome(next);
    writeHomeStyle(next);
    if (
      (next.skin === "paper" || next.skin === "ours") &&
      look !== next.skin
    ) {
      q.set("look", next.skin);
      const qs = q.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }
    try {
      setMin(window.sessionStorage.getItem("halo-mixer-min") === "1");
    } catch {
      /* private browsing */
    }
    return () => {
      delete document.documentElement.dataset.preview;
      delete document.documentElement.dataset.previewMixer;
    };
  }, []);

  useEffect(() => {
    if (min) document.documentElement.dataset.previewMixer = "min";
    else delete document.documentElement.dataset.previewMixer;
    try {
      window.sessionStorage.setItem("halo-mixer-min", min ? "1" : "0");
    } catch {
      /* private browsing */
    }
  }, [min]);

  useEffect(() => {
    function sync() {
      setLoop(readLoopStats());
    }
    sync();
    return subscribeKeep(sync);
  }, []);

  useEffect(() => {
    writeHarvestStyle(style);
  }, [orb, fly, keepTint, dock, style]);

  useEffect(() => {
    let stop = false;
    let busy = false;
    async function ping() {
      if (busy) return;
      busy = true;
      try {
        try {
          const res = await fetch("/api/dev/capture", { cache: "no-store" });
          if (res.ok) {
            const data = (await res.json()) as { ok?: boolean; macSink?: boolean };
            if (!stop) setSinkUp(data.ok === true || Boolean(data.macSink));
            return;
          }
        } catch {
          /* fall through */
        }
        try {
          const res = await fetch("http://127.0.0.1:8791/health", {
            cache: "no-store",
          });
          if (!stop) setSinkUp(res.ok);
        } catch {
          if (!stop) setSinkUp(false);
        }
      } finally {
        busy = false;
      }
    }
    void ping();
    const id = window.setInterval(ping, 4000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, []);

  function setParam(key: string, value: string, blankIf?: string) {
    const next = new URLSearchParams(params.toString());
    if (blankIf !== undefined && value === blankIf) next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function setScreen(value: string) {
    if (value !== "home") {
      window.dispatchEvent(new Event("halo-home-play-end"));
      clearComposeHandoff();
    }
    const next = new URLSearchParams(params.toString());
    if (value === "home") {
      next.delete("view");
      next.delete("thread");
    } else next.set("view", value);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function patchHome(partial: Partial<HomeStyle>) {
    const next = { ...home, ...partial };
    setHome(next);
    writeHomeStyle(next);
    if (partial.skin === "paper" || partial.skin === "ours") {
      setParam("look", partial.skin);
    }
  }

  function replayHarvest() {
    if (chatRec) {
      window.dispatchEvent(new Event("halo-harvest-stop"));
      return;
    }
    setChatRec(true);
    window.dispatchEvent(new Event("halo-harvest-replay"));
  }

  function replayHome() {
    if (homeRec) {
      window.dispatchEvent(new Event("halo-home-stop"));
      return;
    }
    setHomeRec(true);
    window.dispatchEvent(new Event("halo-home-replay"));
  }

  return (
    <div
      className={`preview-switcher${min ? " is-min" : ""}`}
      role="region"
      aria-label="Preview options"
    >
      <button
        type="button"
        className="preview-switcher__toggle"
        onClick={() => setMin((prev) => !prev)}
        title={min ? "Show mixer" : "Hide mixer"}
      >
        {min ? "Mix" : "Hide"}
      </button>
      <div className="preview-switcher__body">
      <HarvestCapture
        film={film}
        onScore={(info) => {
          setChatRec(false);
          setScore(info);
        }}
      />
      <HomeCapture
        film={homeFilm}
        onScore={(info) => {
          setHomeRec(false);
          setHomeScore(info);
        }}
      />
      <div className="preview-switcher__group">
        {SCREENS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={screen === item.id ? "is-on" : ""}
            onClick={() => setScreen(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {screen === "home" ? (
        <>
          <p className="preview-switcher__label">Look</p>
          <p className="preview-switcher__hint">
            {HOME_MIXER_HELP.skin[home.skin]}
          </p>
          <div className="preview-switcher__group">
            {SKINS.map((item) => (
              <button
                key={item.id}
                type="button"
                title={HOME_MIXER_HELP.skin[item.id]}
                className={home.skin === item.id ? "is-on" : ""}
                onClick={() => patchHome({ skin: item.id })}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="preview-switcher__label">Tone</p>
          <p className="preview-switcher__hint">
            {HOME_MIXER_HELP.palette[home.palette]}
          </p>
          <div className="preview-switcher__group">
            {PALETTES.map((item) => (
              <button
                key={item.id}
                type="button"
                title={HOME_MIXER_HELP.palette[item.id]}
                className={home.palette === item.id ? "is-on" : ""}
                onClick={() => patchHome({ palette: item.id })}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="preview-switcher__label">Ink</p>
          <p className="preview-switcher__hint">
            {HOME_MIXER_HELP.ink[home.ink]}
          </p>
          <div className="preview-switcher__group">
            {INKS.map((item) => (
              <button
                key={item.id}
                type="button"
                title={HOME_MIXER_HELP.ink[item.id]}
                className={home.ink === item.id ? "is-on" : ""}
                onClick={() => patchHome({ ink: item.id })}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="preview-switcher__label">Lift {home.lift}</p>
          <p className="preview-switcher__hint">
            Candy brightness. 0 is muted, 100 is neon.
          </p>
          <input
            className="preview-switcher__slider"
            type="range"
            min={0}
            max={100}
            value={home.lift}
            onChange={(e) => patchHome({ lift: Number(e.target.value) })}
          />
          <p className="preview-switcher__label">Inner light</p>
          <p className="preview-switcher__hint">
            {HOME_MIXER_HELP.lamp[home.lamp]}
          </p>
          <div className="preview-switcher__group">
            {LAMPS.map((item) => (
              <button
                key={item.id}
                type="button"
                title={HOME_MIXER_HELP.lamp[item.id]}
                className={home.lamp === item.id ? "is-on" : ""}
                onClick={() => patchHome({ lamp: item.id })}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="preview-switcher__label">Chips {home.keepCount}</p>
          <p className="preview-switcher__hint">
            Seat-map count (1–16 hard cap). Default 12. Low n walks corners;
            8–16 is the healthy live range.
          </p>
          <input
            className="preview-switcher__slider"
            type="range"
            min={1}
            max={16}
            step={1}
            value={home.keepCount}
            onChange={(e) =>
              patchHome({ keepCount: Number(e.target.value) })
            }
          />
          <p className="preview-switcher__label">Clump {home.cluster}</p>
          <p className="preview-switcher__hint">
            Lab leftover — Keep seating is constellation now. Slider kept for
            mixer experiments only.
          </p>
          <input
            className="preview-switcher__slider"
            type="range"
            min={0}
            max={100}
            value={home.cluster}
            onChange={(e) => patchHome({ cluster: Number(e.target.value) })}
          />
          <p className="preview-switcher__label">Scatter {home.scatter}</p>
          <p className="preview-switcher__hint">
            Pale Ask bubbles only. Keep facts use fixed constellation seats
            (1–16), not this slider.
          </p>
          <input
            className="preview-switcher__slider"
            type="range"
            min={0}
            max={100}
            value={home.scatter}
            onChange={(e) => patchHome({ scatter: Number(e.target.value) })}
          />
          <p className="preview-switcher__label">Loop</p>
          <p className="preview-switcher__hint">
            Due {loop.due} · Keep {loop.keep} · Mastered {loop.mastered} ·{" "}
            {loop.total}/{loop.cap}. Miss stays on Home. Three clears → mastered.
            Empty Keep keeps the time greeting. You’re clear only after the field
            is empty and Keep still has beads. Keep sorts gold → silver → bronze →
            new. Rings are rank; kind color stays. Mix Master fires the clear pulse.
          </p>
          <div className="preview-switcher__group preview-switcher__group--wrap">
            <button type="button" onClick={() => seedTutorialPack()}>
              Tutorial
            </button>
            <button type="button" onClick={() => seedKeepDemo(true)}>
              Demo pack
            </button>
            <button type="button" onClick={() => clearKeepChips()}>
              Empty
            </button>
            <button type="button" onClick={() => spawnLabFact()}>
              Spawn
            </button>
          </div>
          <div className="preview-switcher__group preview-switcher__group--wrap">
            <button type="button" onClick={() => dropKeepDue()}>
              Due now
            </button>
            <button type="button" onClick={() => bankDue()}>
              Bank
            </button>
            <button type="button" onClick={() => gradeDue("ok")}>
              Clear
            </button>
            <button type="button" onClick={() => gradeDue("miss")}>
              Miss
            </button>
            <button type="button" onClick={() => masterDue()}>
              Master
            </button>
          </div>
          <div className="preview-switcher__group">
            <button
              type="button"
              className={homeRec ? "is-on" : ""}
              onClick={replayHome}
            >
              {homeRec ? "Stop" : "Start"}
            </button>
            <button
              type="button"
              className={homeFilm ? "is-on" : ""}
              title="Stills every couple of seconds while recording, plus travel. Off is the cleaner fps number."
              onClick={() => setHomeFilm((prev) => !prev)}
            >
              Film
            </button>
          </div>
          <p className="preview-switcher__hint">
            Start records until you hit Stop. Film on grabs stills along the way (travel too). Writes web/captures/home/latest.
          </p>
          <p className={`preview-switcher__hint ${sinkUp ? "is-ok" : "is-wait"}`}>
            {sinkUp
              ? "Replay is ready. Film stills land in web/captures/home/latest."
              : "Replay cannot save yet. Stay on localhost, or run npm run capture:sink in web/."}
          </p>
          {homeScore ? (
            <ul className="preview-switcher__score">
              <li>
                {homeScore.fps} fps · {homeScore.chips} chips ·{" "}
                {homeScore.overlaps} overlaps ·{" "}
                {homeScore.sink === "none" ? "not saved" : "saved"}
              </li>
            </ul>
          ) : null}
        </>
      ) : (
        <>
          <p className="preview-switcher__label">Shape</p>
          <p className="preview-switcher__hint">{MIXER_HELP.shape[style.shape]}</p>
          <div className="preview-switcher__group">
            {SHAPES.map((item) => (
              <button
                key={item.id}
                type="button"
                title={MIXER_HELP.shape[item.id]}
                className={style.shape === item.id ? "is-on" : ""}
                onClick={() => setParam("orb", item.id, "drop")}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="preview-switcher__label">Flight</p>
          <p className="preview-switcher__hint">{MIXER_HELP.flight[style.flight]}</p>
          <div className="preview-switcher__group">
            {FLIGHTS.map((item) => (
              <button
                key={item.id}
                type="button"
                title={MIXER_HELP.flight[item.id]}
                className={style.flight === item.id ? "is-on" : ""}
                onClick={() => setParam("fly", item.id, "burst")}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="preview-switcher__label">Wake</p>
          <p className="preview-switcher__hint">{MIXER_HELP.wake[style.keep]}</p>
          <div className="preview-switcher__group">
            {WAKES.map((item) => (
              <button
                key={item.id}
                type="button"
                title={MIXER_HELP.wake[item.id]}
                className={style.keep === item.id ? "is-on" : ""}
                onClick={() => setParam("keep", item.id, "pebble")}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="preview-switcher__label">Dock</p>
          <p className="preview-switcher__hint">{MIXER_HELP.dock[style.dock]}</p>
          <div className="preview-switcher__group">
            {DOCKS.map((item) => (
              <button
                key={item.id}
                type="button"
                title={MIXER_HELP.dock[item.id]}
                className={style.dock === item.id ? "is-on" : ""}
                onClick={() => setParam("dock", item.id, "beads")}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="preview-switcher__group">
            <button
              type="button"
              className={chatRec ? "is-on" : ""}
              onClick={replayHarvest}
            >
              {chatRec ? "Stop" : "Start"}
            </button>
            <button
              type="button"
              className={film ? "is-on" : ""}
              title="Stills every couple of seconds while recording. Off keeps the motion smoother."
              onClick={() => setParam("film", film ? "" : "1", "")}
            >
              Film
            </button>
          </div>
          <p className="preview-switcher__hint">
            Start records until you hit Stop. Chat Start still fires the harvest take. Film on grabs stills of the flight.
          </p>
          <p className={`preview-switcher__hint ${sinkUp ? "is-ok" : "is-wait"}`}>
            {sinkUp
              ? "Replay is ready. Captures land in web/captures/harvest/latest."
              : "Replay cannot save yet. Stay on localhost, or run npm run capture:sink in web/."}
          </p>
          {score ? (
            <ul className="preview-switcher__score">
              <li>
                {score.fps} fps · {score.sink === "none" ? "not saved" : "saved"}
              </li>
              {score.checks.map((check) => (
                <li key={check.id} className={check.ok ? "is-ok" : "is-bad"}>
                  {check.ok ? "OK" : "Look"} · {check.label}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
      </div>
    </div>
  );
}
