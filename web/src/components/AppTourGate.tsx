"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AppFirstRun } from "@/components/AppFirstRun";
import { appTourDone } from "@/lib/app-tour";

export function AppTourGate({ children }: { children: ReactNode }) {
  const [tour, setTour] = useState(false);

  useEffect(() => {
    setTour(!appTourDone());
  }, []);

  if (tour) {
    return <AppFirstRun onDone={() => setTour(false)} />;
  }

  return children;
}
