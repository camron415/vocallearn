"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { applyHaloBoot, writeHaloThemeCookie } from "@/lib/halo-boot";

export type MotionIntensity = "reduced" | "full";
export type HaloWallpaper = "mist" | "sky";
export type HaloTheme = "light" | "dark";
export type HaloEngine = "chromium" | "webkit" | "other";

type MotionContextValue = {
  intensity: MotionIntensity;
  setIntensity: (value: MotionIntensity) => void;
  wallpaper: HaloWallpaper;
  setWallpaper: (value: HaloWallpaper) => void;
  theme: HaloTheme;
  setTheme: (value: HaloTheme) => void;
  prefersReduced: boolean;
  autoSoft: boolean;
  finePointer: boolean;
  engine: HaloEngine;
};

const MotionContext = createContext<MotionContextValue | null>(null);

const STORAGE_KEY = "halo-motion-intensity";
const WALLPAPER_KEY = "halo-wallpaper";
const THEME_KEY = "halo-theme";

function detectWeakHardware(): boolean {
  if (typeof navigator === "undefined") return false;

  const cores = navigator.hardwareConcurrency || 8;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;

  if (connection?.saveData) return true;
  if (connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g") {
    return true;
  }
  if (cores <= 4) return true;
  if (typeof memory === "number" && memory <= 4) return true;
  return false;
}

/**
 * SVG-filtered backdrops only land in Chromium. Safari claims support through
 * @supports and then drops the whole backdrop-filter, so this is a UA check on
 * purpose — Safari gets the token glass + its own native material instead.
 */
function detectEngine(): "chromium" | "webkit" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;

  if (/Firefox\/|FxiOS/.test(ua)) return "other";
  // iOS wrappers are WebKit whatever their badge says.
  if (/CriOS|EdgiOS|OPiOS/.test(ua)) return "webkit";
  if (/Chrome\/|Chromium\/|Edg\//.test(ua)) return "chromium";
  if (/AppleWebKit/.test(ua)) return "webkit";
  return "other";
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const [prefersReduced, setPrefersReduced] = useState(false);
  const [autoSoft, setAutoSoft] = useState(false);
  const [finePointer, setFinePointer] = useState(true);
  const [intensity, setIntensityState] = useState<MotionIntensity>("full");
  const [wallpaper, setWallpaperState] = useState<HaloWallpaper>("mist");
  const [theme, setThemeState] = useState<HaloTheme>("light");
  const [engine, setEngine] = useState<HaloEngine>("other");

  useLayoutEffect(() => {
    applyHaloBoot();
    const next = detectEngine();
    setEngine(next);
    document.documentElement.dataset.haloEngine = next;
    try {
      const urlTheme = new URLSearchParams(window.location.search).get("theme");
      if (urlTheme === "light" || urlTheme === "dark") {
        setThemeState(urlTheme);
        document.documentElement.dataset.haloTheme = urlTheme;
      } else {
        const savedTheme = window.localStorage.getItem(THEME_KEY);
        if (savedTheme === "light" || savedTheme === "dark") {
          setThemeState(savedTheme);
          document.documentElement.dataset.haloTheme = savedTheme;
        }
      }
    } catch {
      /* private browsing */
    }
  }, []);

  useEffect(() => {
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = window.matchMedia("(pointer: fine)");
    const sync = () => {
      setPrefersReduced(reduceQuery.matches);
      setFinePointer(pointerQuery.matches);
    };
    sync();
    reduceQuery.addEventListener("change", sync);
    pointerQuery.addEventListener("change", sync);

    const weak = detectWeakHardware();
    setAutoSoft(weak);

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "reduced" || saved === "full") {
        setIntensityState(saved);
      } else if (reduceQuery.matches || weak) {
        setIntensityState("reduced");
      }

      const urlTheme = new URLSearchParams(window.location.search).get("theme");
      if (urlTheme === "light" || urlTheme === "dark") {
        setThemeState(urlTheme);
      } else {
        const savedTheme = window.localStorage.getItem(THEME_KEY);
        if (savedTheme === "light" || savedTheme === "dark") {
          setThemeState(savedTheme);
        }
      }
    } catch {
      if (reduceQuery.matches || weak) setIntensityState("reduced");
    }

    const root = document.documentElement;
    if (weak) root.dataset.haloPerf = "soft";
    if (
      !(
        window.CSS?.supports?.("backdrop-filter", "blur(4px)") ||
        window.CSS?.supports?.("-webkit-backdrop-filter", "blur(4px)")
      )
    ) {
      root.dataset.haloGlass = "off";
    }

    let cancelled = false;
    const markReady = () => {
      if (!cancelled) root.dataset.haloReady = "1";
    };
    markReady();

    const phone = window.matchMedia("(max-width: 720px)");
    const vv = window.visualViewport;
    const syncHeight = () => {
      if (!phone.matches || !vv) {
        root.style.removeProperty("--app-height");
        root.style.removeProperty("--app-top");
        return;
      }
      root.style.setProperty("--app-height", `${Math.round(vv.height)}px`);
      root.style.setProperty("--app-top", `${Math.round(vv.offsetTop)}px`);
    };
    syncHeight();
    vv?.addEventListener("resize", syncHeight);
    vv?.addEventListener("scroll", syncHeight);
    phone.addEventListener("change", syncHeight);

    return () => {
      cancelled = true;
      reduceQuery.removeEventListener("change", sync);
      pointerQuery.removeEventListener("change", sync);
      vv?.removeEventListener("resize", syncHeight);
      vv?.removeEventListener("scroll", syncHeight);
      phone.removeEventListener("change", syncHeight);
    };
  }, []);

  const effective: MotionIntensity = prefersReduced ? "reduced" : intensity;

  useEffect(() => {
    document.documentElement.dataset.haloMotion =
      effective === "reduced" ? "soft" : "full";
  }, [effective]);

  useEffect(() => {
    document.documentElement.dataset.haloBg = "mist";
  }, []);

  useEffect(() => {
    document.documentElement.dataset.haloTheme = theme;
  }, [theme]);

  const setIntensity = useCallback((value: MotionIntensity) => {
    setIntensityState(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* private browsing */
    }
  }, []);

  const setWallpaper = useCallback((value: HaloWallpaper) => {
    setWallpaperState(value);
    try {
      window.localStorage.setItem(WALLPAPER_KEY, value);
    } catch {
      /* private browsing */
    }
  }, []);

  const setTheme = useCallback((value: HaloTheme) => {
    setThemeState(value);
    try {
      window.localStorage.setItem(THEME_KEY, value);
      writeHaloThemeCookie(value);
    } catch {
      /* private browsing */
    }
  }, []);

  const value = useMemo(
    () => ({
      intensity,
      setIntensity,
      wallpaper,
      setWallpaper,
      theme,
      setTheme,
      prefersReduced,
      autoSoft,
      finePointer,
      engine,
    }),
    [intensity, setIntensity, wallpaper, setWallpaper, theme, setTheme, prefersReduced, autoSoft, finePointer, engine]
  );

  return (
    <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
  );
}

export function useMotionSettings() {
  const ctx = useContext(MotionContext);
  if (!ctx) {
    throw new Error("useMotionSettings must be used within MotionProvider");
  }
  return ctx;
}

export function useEffectiveMotion(): MotionIntensity {
  const { intensity, prefersReduced } = useMotionSettings();
  if (prefersReduced) return "reduced";
  return intensity;
}

/** Wet edge runs whenever motion is full — including touch. */
export function useLiquidEnabled(): boolean {
  return useEffectiveMotion() === "full";
}

function subscribePaperLook(onChange: () => void) {
  const watch = new MutationObserver(onChange);
  watch.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-home-skin"],
  });
  return () => watch.disconnect();
}

function getPaperLookSnapshot() {
  return document.documentElement.getAttribute("data-home-skin") === "paper";
}

function getPaperLookServerSnapshot() {
  return false;
}

/** Paper Look is dry chrome. Ours and Harvest flight stay wet.
 *  useState(false)+layout effect reset to wet on Safari refresh, and the
 *  remounted .water__skin paints -apple-system-glass-material over the fill. */
export function usePaperLook(): boolean {
  return useSyncExternalStore(
    subscribePaperLook,
    getPaperLookSnapshot,
    getPaperLookServerSnapshot
  );
}
