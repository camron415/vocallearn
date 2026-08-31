"use client";

import { useEffect, useState } from "react";

/** Phone / tablet touch — same cut as v1 mobile QA and MenuSheet instant mode. */
export function isCoarsePointer() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(max-width: 720px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

export function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 720px)");
    const touch = window.matchMedia("(pointer: coarse)");
    const sync = () => setCoarse(narrow.matches || touch.matches);
    sync();
    narrow.addEventListener("change", sync);
    touch.addEventListener("change", sync);
    return () => {
      narrow.removeEventListener("change", sync);
      touch.removeEventListener("change", sync);
    };
  }, []);

  return coarse;
}
