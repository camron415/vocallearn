import { syncAppChrome } from "./app-chrome";

export type HaloThemePref = "auto" | "light" | "dark";
export type HaloTheme = "light" | "dark";

export const THEME_KEY = "halo-theme";

export function readThemePref(): HaloThemePref {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === "auto" || t === "light" || t === "dark") return t;
  } catch {
    /* private browsing */
  }
  return "auto";
}

export function systemPrefersDark() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveTheme(pref: HaloThemePref): HaloTheme {
  if (pref === "light") return "light";
  if (pref === "dark") return "dark";
  return systemPrefersDark() ? "dark" : "light";
}

export function writeThemeCookie(pref: HaloThemePref) {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${THEME_KEY}=${pref}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {
    /* cookie blocked */
  }
}

/** `data-halo-theme` is always resolved light|dark so CSS and the status bar match. */
export function paintHaloTheme(pref: HaloThemePref) {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(pref);
  const d = document.documentElement;
  d.setAttribute("data-halo-theme", resolved);
  d.setAttribute("data-halo-theme-pref", pref);
  writeThemeCookie(pref);
  syncAppChrome();
}

export const APP_THEME_INLINE =
  '(function(){try{var d=document.documentElement;var t=null;try{t=localStorage.getItem("halo-theme");}catch(e){}var pref=t==="auto"||t==="light"||t==="dark"?t:"auto";var dark=pref==="dark"||(pref==="auto"&&window.matchMedia("(prefers-color-scheme: dark)").matches);d.setAttribute("data-halo-theme",dark?"dark":"light");d.setAttribute("data-halo-theme-pref",pref);try{document.cookie="halo-theme="+pref+";Path=/;Max-Age=31536000;SameSite=Lax";}catch(e2){}}catch(e){}})();';
