/** First-paint Paper/theme boot. Safari paints HTML/CSS before
 *  instrumentation-client; layout.tsx inlines HALO_BOOT_INLINE so
 *  `data-home-skin` is paper before `.compose` is drawn.
 *  Lab `/preview` follows mixer. Everything else (including `/ask`) is paper. */

import { isLabPreviewPath } from "@/lib/lab-preview";

export const PREVIEW_SKIN_COOKIE = "halo-preview-skin";
export const THEME_COOKIE = "halo-theme";

/** `/login` and `/invite/*` always Paper. Does not change family `/ask`. */
export function isAuthPaperPath(pathname?: string) {
  const path =
    pathname ??
    (typeof window === "undefined" ? "" : window.location.pathname);
  return path === "/login" || path.startsWith("/invite/");
}

export function writeHaloThemeCookie(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${THEME_COOKIE}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {
    /* cookie blocked */
  }
}

function mixerSkin(): "paper" | "ours" | null {
  const skins: string[] = [];
  for (const store of [sessionStorage, localStorage]) {
    try {
      const parsed = JSON.parse(store.getItem("halo-home-mixer") || "null") as {
        skin?: string;
      } | null;
      if (parsed?.skin === "paper" || parsed?.skin === "ours") {
        skins.push(parsed.skin);
      }
    } catch {
      /* private browsing / bad JSON */
    }
  }
  if (skins.includes("paper")) return "paper";
  if (skins.includes("ours")) return "ours";
  return null;
}

function cookieSkin(): "paper" | "ours" | null {
  const match = document.cookie.match(
    /(?:^|; )halo-preview-skin=(paper|ours)(?:;|$)/
  );
  return match ? (match[1] as "paper" | "ours") : null;
}

function mixerBlob(): Record<string, unknown> {
  for (const store of [localStorage, sessionStorage]) {
    try {
      const parsed = JSON.parse(store.getItem("halo-home-mixer") || "null");
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    } catch {
      /* ignore */
    }
  }
  return {};
}

/** Lab preview: URL, then cookie, then mixer. Portfolio (no ?mixer=1) on prod = paper. */
export function resolvePreviewSkin(): "paper" | "ours" {
  if (typeof location !== "undefined" && !isLabPreviewPath(location.pathname)) {
    return "paper";
  }
  const q = new URLSearchParams(location.search);
  const look = q.get("look");
  if (look === "paper" || look === "ours") return look;
  const host = typeof location !== "undefined" ? location.hostname : "";
  const local = host === "localhost" || host === "127.0.0.1";
  if (!local && q.get("mixer") !== "1") return "paper";
  return cookieSkin() ?? mixerSkin() ?? "paper";
}

export function previewWantsPaper(): boolean {
  try {
    return resolvePreviewSkin() === "paper";
  } catch {
    return false;
  }
}

function setAttr(el: HTMLElement, name: string, value: string) {
  if (el.getAttribute(name) === value) return;
  el.setAttribute(name, value);
}

function bootFromDom(d: HTMLElement) {
  const t = localStorage.getItem("halo-theme");
  if (t === "dark" || t === "light") {
    setAttr(d, "data-halo-theme", t);
    writeHaloThemeCookie(t);
  }
  const s = mixerBlob();
  const q = new URLSearchParams(location.search);
  const themeQ = q.get("theme");
  if (themeQ === "dark" || themeQ === "light") {
    setAttr(d, "data-halo-theme", themeQ);
    writeHaloThemeCookie(themeQ);
  }
  const tone =
    s.palette === "glass" || s.palette === "wash" || s.palette === "match"
      ? s.palette
      : "match";
  const ink =
    s.ink === "halo" || s.ink === "gummy" || s.ink === "dusk" || s.ink === "citrus"
      ? s.ink
      : "citrus";
  const skin = resolvePreviewSkin();
  let lift = Math.round(Number(s.lift));
  if (!Number.isFinite(lift)) lift = 100;
  if (lift < 0) lift = 0;
  if (lift > 100) lift = 100;
  setAttr(d, "data-home-tone", String(tone));
  setAttr(d, "data-home-ink", String(ink));
  setAttr(d, "data-home-skin", skin);
  d.style.setProperty("--home-lift", String(lift));
  d.style.setProperty("--keep-frost", String(((100 - lift) * 0.26 + 20) / 100));
}

export function applyHaloBoot() {
  if (typeof document === "undefined") return;
  try {
    bootFromDom(document.documentElement);
  } catch {
    /* private browsing / first paint */
  }
}

export const HALO_BOOT_INLINE = `(function(){try{var d=document.documentElement;var t=localStorage.getItem("halo-theme");if(t==="dark"||t==="light"){d.setAttribute("data-halo-theme",t);try{document.cookie="halo-theme="+t+";Path=/;Max-Age=31536000;SameSite=Lax";}catch(e0){}}var s={};try{s=JSON.parse(localStorage.getItem("halo-home-mixer")||"null")||JSON.parse(sessionStorage.getItem("halo-home-mixer")||"{}")||{};}catch(e){s={};}var q=new URLSearchParams(location.search);var look=q.get("look");var themeQ=q.get("theme");if(themeQ==="dark"||themeQ==="light"){d.setAttribute("data-halo-theme",themeQ);try{document.cookie="halo-theme="+themeQ+";Path=/;Max-Age=31536000;SameSite=Lax";}catch(e1){}}var tone=s.palette==="glass"||s.palette==="wash"||s.palette==="match"?s.palette:"match";var ink=s.ink==="halo"||s.ink==="gummy"||s.ink==="dusk"||s.ink==="citrus"?s.ink:"citrus";var cookie=null;var cm=document.cookie.match(/(?:^|; )halo-preview-skin=(paper|ours)(?:;|$)/);if(cm)cookie=cm[1];var stored=null;try{var a=JSON.parse(sessionStorage.getItem("halo-home-mixer")||"null");var b=JSON.parse(localStorage.getItem("halo-home-mixer")||"null");if((a&&a.skin==="paper")||(b&&b.skin==="paper"))stored="paper";else if((a&&a.skin==="ours")||(b&&b.skin==="ours"))stored="ours";}catch(e2){}var lab=location.pathname==="/preview"||location.pathname.indexOf("/preview/")===0;var skin=lab?(look==="paper"||look==="ours"?look:cookie||stored||"ours"):"paper";var lift=Math.round(Number(s.lift));if(!isFinite(lift))lift=100;if(lift<0)lift=0;if(lift>100)lift=100;d.setAttribute("data-home-tone",String(tone));d.setAttribute("data-home-ink",String(ink));if(d.getAttribute("data-home-skin")!==skin)d.setAttribute("data-home-skin",skin);d.style.setProperty("--home-lift",String(lift));d.style.setProperty("--keep-frost",String(((100-lift)*0.26+20)/100));}catch(e){}})();`;

if (typeof window !== "undefined") {
  window.addEventListener("pageshow", applyHaloBoot);
}
