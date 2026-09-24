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
import { applyHaloBoot } from "@/lib/halo-boot";
import {
  paintHaloTheme,
  readThemePref,
  THEME_KEY,
  type HaloThemePref,
} from "@/lib/halo-theme";

export type { HaloTheme, HaloThemePref } from "@/lib/halo-theme";
export type MotionIntensity = "reduced" | "full";
export type HaloWallpaper = "mist" | "sky";
export type HaloEngine = "chromium" | "webkit" | "other";

type MotionContextValue = {
  intensity: MotionIntensity;
  setIntensity: (value: MotionIntensity) => void;
  wallpaper: HaloWallpaper;
  setWallpaper: (value: HaloWallpaper) => void;
  theme: HaloThemePref;
  setTheme: (value: HaloThemePref) => void;
  prefersReduced: boolean;
  autoSoft: boolean;
  finePointer: boolean;
  engine: HaloEngine;
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
  const [theme, setThemeState] = useState<HaloThemePref>("auto");
  const [engine, setEngine] = useState<HaloEngine>("other");

  useLayoutEffect(() => {
    applyHaloBoot();
    const next = detectEngine();
    setEngine(next);
    document.documentElement.dataset.haloEngine = next;
    try {
      const urlTheme = new URLSearchParams(window.location.search).get("theme");
      if (urlTheme === "light" || urlTheme === "dark" || urlTheme === "auto") {
        setThemeState(urlTheme);
        paintHaloTheme(urlTheme);
      } else {
        const savedTheme = readThemePref();
        setThemeState(savedTheme);
        paintHaloTheme(savedTheme);
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
      if (urlTheme === "light" || urlTheme === "dark" || urlTheme === "auto") {
        setThemeState(urlTheme);
      } else {
        setThemeState(readThemePref());
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
    /* iOS owns the focused field while it presents the keyboard. Moving that
       field mid-present makes WKWebView resign it, so the keyboard aborts and
       the composer falls back to rest. The native inset snaps, so it is only
       written once the measured keyboard has held still. Never guessed, and
       nothing in here scrolls the page. */
    const KB_MIN = 80;
    const KB_JITTER = 12;
    const KB_STILL = 100;
    const KB_STEP = 24;
    let restingH = window.innerHeight;
    let kbHide = 0;
    let settleTick = 0;
    let settleH = -1;
    let settleSince = 0;
    let lifted = -1;
    let focusAt = 0;
    let guessTick = 0;
    const resetSettle = () => {
      window.clearTimeout(settleTick);
      settleH = -1;
      settleSince = 0;
    };
    const composeFocused = () =>
      Boolean(
        document.activeElement?.closest?.(
          ".compose, .ask-shell-compose, .compose-dock"
        )
      );
    const releaseKb = () => {
      resetSettle();
      window.clearTimeout(guessTick);
      lifted = -1;
      focusAt = 0;
      root.style.setProperty("--kb-inset", "0px");
      root.dataset.haloKbFade = "1";
      kbHide = window.setTimeout(() => {
        if (composeFocused()) return;
        delete root.dataset.haloKb;
        window.setTimeout(() => {
          if (!composeFocused()) delete root.dataset.haloKbFade;
        }, 480);
      }, 480);
    };
    const syncHeight = () => {
      if (!phone.matches) {
        root.style.removeProperty("--kb-inset");
        delete root.dataset.haloKb;
        delete root.dataset.haloKbFade;
        restingH = window.innerHeight;
        window.clearTimeout(kbHide);
        resetSettle();
        window.clearTimeout(guessTick);
        lifted = -1;
        focusAt = 0;
        return;
      }
      const focused = composeFocused();
      const native = root.dataset.haloNative === "1";
      if (!focused) restingH = window.innerHeight;
      const visual = vv?.height ?? window.innerHeight;
      const offset = vv?.offsetTop ?? 0;
      const kbMeasured = Math.max(0, Math.round(restingH - visual - offset));
      window.clearTimeout(kbHide);
      /* Never guess a lift once Ask has blurred, or Home stays faded until the viewport catches up. */
      if (native && !focused) {
        // A focus blip while the keys are still up used to fade Home back
        // and let chips take the tap. Stay faded until the keyboard is gone.
        if (kbMeasured >= KB_MIN) {
          root.dataset.haloKb = "1";
          return;
        }
        releaseKb();
        return;
      }
      if (native && focused) {
        // Home fades on the tap. The field itself does not move yet.
        root.dataset.haloKb = "1";
        if (focusAt === 0) focusAt = Date.now();
        if (
          kbMeasured < KB_MIN ||
          (lifted >= 0 && Math.abs(kbMeasured - lifted) < KB_STEP)
        ) {
          resetSettle();
          /* WKWebView often never shrinks. One lift after the keys have
             finished presenting, so the caret is not moved mid-animation. */
          if (lifted < 0 && Date.now() - focusAt >= 520) {
            const guess = Math.round(
              Math.min(400, Math.max(240, window.innerHeight * 0.4))
            );
            lifted = guess;
            root.style.setProperty("--kb-inset", `${guess}px`);
          } else if (lifted < 0) {
            window.clearTimeout(guessTick);
            guessTick = window.setTimeout(syncHeight, 520 - (Date.now() - focusAt));
          }
          return;
        }
        const now = Date.now();
        if (settleH < 0 || Math.abs(kbMeasured - settleH) > KB_JITTER) {
          settleH = kbMeasured;
          settleSince = now;
        }
        const wait = settleSince + KB_STILL - now;
        if (wait > 0) {
          window.clearTimeout(settleTick);
          settleTick = window.setTimeout(syncHeight, wait);
          return;
        }
        resetSettle();
        window.clearTimeout(guessTick);
        lifted = kbMeasured;
        root.style.setProperty("--kb-inset", `${kbMeasured}px`);
        return;
      }
      root.style.setProperty("--kb-inset", `${kbMeasured}px`);
      if (kbMeasured > 80 || (focused && kbMeasured > 24)) {
        root.dataset.haloKb = "1";
      } else {
        releaseKb();
      }
    };
    syncHeight();
    vv?.addEventListener("resize", syncHeight);
    // A viewport scroll while the keys are up slides the composer under them.
    // Resize still updates the inset; scroll does not.
    vv?.addEventListener("scroll", () => {
      if (root.dataset.haloNative === "1" && composeFocused()) return;
      syncHeight();
    });
    phone.addEventListener("change", syncHeight);
    document.addEventListener("focusin", syncHeight);
    const blurKb = () => window.setTimeout(syncHeight, 40);
    document.addEventListener("focusout", blurKb);

    return () => {
      cancelled = true;
      window.clearTimeout(kbHide);
      window.clearTimeout(settleTick);
      window.clearTimeout(guessTick);
      reduceQuery.removeEventListener("change", sync);
      pointerQuery.removeEventListener("change", sync);
      vv?.removeEventListener("resize", syncHeight);
      vv?.removeEventListener("scroll", syncHeight);
      phone.removeEventListener("change", syncHeight);
      document.removeEventListener("focusin", syncHeight);
      document.removeEventListener("focusout", blurKb);
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
    paintHaloTheme(theme);
    if (theme !== "auto") return;
    const q = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => paintHaloTheme("auto");
    q.addEventListener("change", onChange);
    return () => q.removeEventListener("change", onChange);
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

  const setTheme = useCallback((value: HaloThemePref) => {
    setThemeState(value);
    try {
      window.localStorage.setItem(THEME_KEY, value);
      paintHaloTheme(value);
    } catch {
      paintHaloTheme(value);
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
