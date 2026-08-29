import { applyHaloBoot } from "./lib/halo-boot";

/** Runs before React hydrates. Layout also inlines this so Safari paints Paper. */
applyHaloBoot();
