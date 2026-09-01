/** Signed-in app (and auth) stay Paper. Lab `/preview` mixer still owns
 *  `halo-boot` skin. Lane A holds halo-boot — this file does not edit it.
 *  Runs after HALO_BOOT_INLINE so /ask is not snapped back to Ours. */

import { isLabPreviewPath } from "@/lib/lab-preview";

export function wantsAppPaper(pathname?: string) {
  return !isLabPreviewPath(pathname);
}

export function applyAppPaperSkin() {
  if (typeof document === "undefined") return;
  try {
    if (!wantsAppPaper()) return;
    const d = document.documentElement;
    if (d.getAttribute("data-home-skin") !== "paper") {
      d.setAttribute("data-home-skin", "paper");
    }
  } catch {
    /* private browsing */
  }
}

export const APP_PAPER_INLINE =
  '(function(){try{var p=location.pathname;if(p==="/preview"||p.indexOf("/preview/")===0)return;var d=document.documentElement;if(d.getAttribute("data-home-skin")!=="paper")d.setAttribute("data-home-skin","paper");}catch(e){}})();';
