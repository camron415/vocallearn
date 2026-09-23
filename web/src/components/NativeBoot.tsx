"use client";

import { useEffect } from "react";
import { syncAppChrome } from "@/lib/app-chrome";
import { markNativeHtml } from "@/lib/native-shell";
import { startHaloJuiceBridge } from "@/lib/halo-juice";

const COMPOSE_HIT = ".compose, .ask-shell-compose, .compose-dock, .compose-suggest";

function inCompose(node: EventTarget | null) {
  return node instanceof Element && Boolean(node.closest(COMPOSE_HIT));
}

/** Ignore the tap that opened Ask, and the ghost tap WKWebView sends while the keyboard is rising. */
let nativeDismissAt = 0;

function armNativeDismiss(event: FocusEvent) {
  if (document.documentElement.dataset.haloNative !== "1") return;
  if (!inCompose(event.target)) return;
  nativeDismissAt = Date.now() + 1800;
}

function blurComposeIfOutside(event: PointerEvent) {
  const root = document.documentElement;
  if (root.dataset.haloKb !== "1") return;
  if (inCompose(event.target)) return;
  if (root.dataset.haloNative === "1" && Date.now() < nativeDismissAt) return;
  const active = document.activeElement;
  if (active instanceof HTMLElement && inCompose(active)) active.blur();
}

function blockNativeChipCallout(event: Event) {
  if (document.documentElement.dataset.haloNative !== "1") return;
  const node = event.target;
  if (node instanceof Element && node.closest(".capsule")) event.preventDefault();
}

export function NativeBoot() {
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      markNativeHtml();
      syncAppChrome();
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(root, {
      attributes: true,
      attributeFilter: ["data-halo-theme"],
    });
    document.addEventListener("pointerdown", blurComposeIfOutside, true);
    document.addEventListener("focusin", armNativeDismiss);
    document.addEventListener("selectstart", blockNativeChipCallout, true);
    document.addEventListener("contextmenu", blockNativeChipCallout, true);
    const stopJuice = startHaloJuiceBridge();
    return () => {
      mo.disconnect();
      stopJuice();
      document.removeEventListener("pointerdown", blurComposeIfOutside, true);
      document.removeEventListener("focusin", armNativeDismiss);
      document.removeEventListener("selectstart", blockNativeChipCallout, true);
      document.removeEventListener("contextmenu", blockNativeChipCallout, true);
    };
  }, []);
  return null;
}
