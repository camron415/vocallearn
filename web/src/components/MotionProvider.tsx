"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type MotionIntensity = "reduced" | "full";
export type HaloWallpaper = "mist" | "sky";

type MotionContextValue = {
  intensity: MotionIntensity;
  setIntensity: (value: MotionIntensity) => void;
  wallpaper: HaloWallpaper;
  setWallpaper: (value: HaloWallpaper) => void;
  prefersReduced: boolean;
  autoSoft: boolean;
  finePointer: boolean;
};

const MotionContext = createContext<MotionContextValue | null>(null);

const STORAGE_KEY = "halo-motion-intensity";
const WALLPAPER_KEY = "halo-wallpaper";

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

    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "reduced" || saved === "full") {
      setIntensityState(saved);
    } else if (reduceQuery.matches || weak) {
      setIntensityState("reduced");
    }

    const savedWallpaper = window.localStorage.getItem(WALLPAPER_KEY);
    if (savedWallpaper === "mist" || savedWallpaper === "sky") {
      setWallpaperState(savedWallpaper);
    }

    const root = document.documentElement;
    if (weak) root.dataset.haloPerf = "soft";
    root.dataset.haloEngine = detectEngine();
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
    const fallback = window.setTimeout(markReady, 800);
    const afterPaint = () => {
      requestAnimationFrame(() => {
        window.setTimeout(markReady, 140);
      });
    };
    const fonts = document.fonts?.ready;
    if (fonts) fonts.then(() => requestAnimationFrame(afterPaint));
    else requestAnimationFrame(afterPaint);

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
      window.clearTimeout(fallback);
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
    document.documentElement.dataset.haloBg = wallpaper;
  }, [wallpaper]);

  const setIntensity = useCallback((value: MotionIntensity) => {
    setIntensityState(value);
    window.localStorage.setItem(STORAGE_KEY, value);
  }, []);

  const setWallpaper = useCallback((value: HaloWallpaper) => {
    setWallpaperState(value);
    window.localStorage.setItem(WALLPAPER_KEY, value);
  }, []);

  const value = useMemo(
    () => ({
      intensity,
      setIntensity,
      wallpaper,
      setWallpaper,
      prefersReduced,
      autoSoft,
      finePointer,
    }),
    [intensity, setIntensity, wallpaper, setWallpaper, prefersReduced, autoSoft, finePointer]
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

/** Water edge needs a real pointer and permission to move. */
export function useLiquidEnabled(): boolean {
  const { finePointer } = useMotionSettings();
  return useEffectiveMotion() === "full" && finePointer;
}
