const LIGHT = "#fafaf9";
const DARK = "#0e0e10";

type StatusBarPlugin = {
  setStyle?: (opts: { style: "DARK" | "LIGHT" | "DEFAULT" }) => Promise<void>;
  setBackgroundColor?: (opts: { color: string }) => Promise<void>;
};

function haloDark() {
  return document.documentElement.getAttribute("data-halo-theme") === "dark";
}

function paintThemeColor(color: string) {
  const metas = [
    ...document.querySelectorAll('meta[name="theme-color"]'),
  ] as HTMLMetaElement[];
  const keep = metas[0] ?? document.createElement("meta");
  keep.setAttribute("name", "theme-color");
  keep.removeAttribute("media");
  keep.setAttribute("content", color);
  if (!keep.parentNode) document.head.appendChild(keep);
  for (const meta of metas) {
    if (meta !== keep) meta.remove();
  }
}

function paintNativeStatusBar(dark: boolean) {
  const cap = (
    window as unknown as {
      Capacitor?: { Plugins?: { StatusBar?: StatusBarPlugin } };
    }
  ).Capacitor;
  const bar = cap?.Plugins?.StatusBar;
  if (!bar?.setStyle) return;
  // Capacitor 8 maps DARK → iOS lightContent (white icons) and LIGHT →
  // darkContent (black icons). The string is the bar, not the glyphs.
  void bar.setStyle({ style: dark ? "DARK" : "LIGHT" });
  void bar.setBackgroundColor?.({ color: dark ? DARK : LIGHT });
}

/** Status bar + theme-color follow Halo theme, not iOS Dark Mode. */
export function syncAppChrome() {
  if (typeof document === "undefined") return;
  const dark = haloDark();
  paintThemeColor(dark ? DARK : LIGHT);
  paintNativeStatusBar(dark);
}

export const APP_CHROME_INLINE =
  '(function(){try{var d=document.documentElement.getAttribute("data-halo-theme")==="dark";var c=d?"#0e0e10":"#fafaf9";var nodes=document.querySelectorAll(\'meta[name="theme-color"]\');var m=nodes[0];if(!m){m=document.createElement("meta");m.setAttribute("name","theme-color");document.head.appendChild(m);}m.removeAttribute("media");m.setAttribute("content",c);for(var i=1;i<nodes.length;i++)nodes[i].remove();var bar=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.StatusBar;if(bar&&bar.setStyle){bar.setStyle({style:d?"DARK":"LIGHT"});if(bar.setBackgroundColor)bar.setBackgroundColor({color:c});}}catch(e){}})();';
