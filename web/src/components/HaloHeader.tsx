"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { ChromeMenu } from "@/components/ChromeMenu";
import { HistoryMenu, type HistoryItem } from "@/components/HistoryMenu";
import { KeepPocket } from "@/components/KeepPocket";
import { GoldKeptBadge } from "@/components/GoldKeptBadge";
import { LibraryMenu } from "@/components/LibraryMenu";
import { SettingsMenu } from "@/components/SettingsMenu";
import { ChromeBar } from "@/components/WaterSurface";
import { APP_NAME } from "@/lib/constants";
import { existingDueHarvest, type HarvestChip } from "@/lib/harvest";
import { addKeepChip, clearKeepChips, readKeepChips, subscribeKeep } from "@/lib/keep-memory";
import { startKeepCloudSync } from "@/lib/keep-cloud";
import { isLabPreviewPath } from "@/lib/lab-preview";
import { useCoarsePointer } from "@/lib/coarse-pointer";
import { haloJuice } from "@/lib/halo-juice";
import type { HaloProfile } from "@/lib/types";

export function HaloHeader({
  conversations = [],
  currentId,
  title: _title,
  homeHref = "/ask",
  showHome = false,
  demo = false,
  profile,
  onOpenChat,
  onDeleted,
  onGoHome,
}: {
  conversations?: HistoryItem[];
  currentId?: string;
  title?: string;
  homeHref?: string;
  showHome?: boolean;
  demo?: boolean;
  profile?: HaloProfile;
  onOpenChat: (id: string) => void;
  onDeleted?: (id: string) => void;
  onGoHome?: () => void;
}) {
  const [keep, setKeep] = useState<HarvestChip[]>([]);
  const compact = useCoarsePointer();

  useEffect(() => {
    setKeep(readKeepChips());
    startKeepCloudSync({ skip: demo || isLabPreviewPath() });
    return subscribeKeep(() => setKeep(readKeepChips()));
  }, [demo]);

  useEffect(() => {
    function addKeep(event: Event) {
      const chip = (event as CustomEvent<HarvestChip>).detail;
      if (!chip?.id) return;
      if (existingDueHarvest(readKeepChips(), chip)) return;
      addKeepChip(chip);
    }
    function resetKeep() {
      clearKeepChips();
    }
    window.addEventListener("halo-keep-add", addKeep);
    window.addEventListener("halo-keep-reset", resetKeep);
    return () => {
      window.removeEventListener("halo-keep-add", addKeep);
      window.removeEventListener("halo-keep-reset", resetKeep);
    };
  }, []);

  function goHome(event: MouseEvent<HTMLAnchorElement>) {
    haloJuice("chrome");
    window.dispatchEvent(new Event("halo-cove-home"));
    if (onGoHome) {
      event.preventDefault();
      onGoHome();
      return;
    }
    if (!showHome) event.preventDefault();
  }

  const brand = (
    <div className="brand-row">
      <Link
        href={homeHref}
        className="brand-home stone-btn"
        aria-label={`${APP_NAME}, home`}
        suppressHydrationWarning
        onClick={goHome}
      >
        <span className="brand-mark brand-mark--sm">{APP_NAME}</span>
      </Link>
      <GoldKeptBadge chips={keep} />
    </div>
  );

  return (
    <>
    <ChromeBar className="topbar">
      {brand}
      <div className="topbar-actions">
        <KeepPocket chips={keep} />
        {compact ? (
          <ChromeMenu
            conversations={conversations}
            currentId={currentId}
            demo={demo}
            profile={profile}
            onOpenChat={onOpenChat}
            onDeleted={onDeleted}
          />
        ) : (
          <>
            <LibraryMenu demo={demo} />
            <HistoryMenu
              items={conversations}
              currentId={currentId}
              demo={demo}
              onSelect={onOpenChat}
              onDeleted={onDeleted}
            />
            <SettingsMenu profile={profile} demo={demo} />
          </>
        )}
      </div>
    </ChromeBar>
    </>
  );
}
