"use client";

import { useEffect } from "react";
import { applyAppPaperSkin } from "@/lib/app-paper-skin";

/** Re-apply Paper after halo-boot pageshow, which still defaults /ask to Ours. */
export function AppPaperSkin() {
  useEffect(() => {
    applyAppPaperSkin();
    window.addEventListener("pageshow", applyAppPaperSkin);
    return () => window.removeEventListener("pageshow", applyAppPaperSkin);
  }, []);
  return null;
}
