"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HistoryMenu, type HistoryItem } from "@/components/HistoryMenu";
import { KeepPocket } from "@/components/KeepPocket";
import { GoldKeptBadge } from "@/components/GoldKeptBadge";
import { LearnReview } from "@/components/LearnReview";
import { LibraryMenu } from "@/components/LibraryMenu";
import { SettingsMenu } from "@/components/SettingsMenu";
import { ChromeBar } from "@/components/WaterSurface";
import { APP_NAME } from "@/lib/constants";
import { existingDueHarvest, type HarvestChip } from "@/lib/harvest";
import { addKeepChip, clearKeepChips, readKeepChips, subscribeKeep } from "@/lib/keep-memory";
import { startKeepCloudSync } from "@/lib/keep-cloud";
import { isLabPreviewPath } from "@/lib/lab-preview";
import type { HaloProfile } from "@/lib/types";

export function HaloHeader({
  conversations = [],
  currentId,
  title,
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
  const [learnOpen, setLearnOpen] = useState(false);
  const [keep, setKeep] = useState<HarvestChip[]>([]);
  const [learnFocus, setLearnFocus] = useState<string | null>(null);

  useEffect(() => {
    setKeep(readKeepChips());
    startKeepCloudSync({ skip: demo || isLabPreviewPath() });
    return subscribeKeep(() => setKeep(readKeepChips()));
  }, [demo]);

  useEffect(() => {
    function openLearn(event: Event) {
      const chipId = (event as CustomEvent<{ chipId?: string }>).detail?.chipId;
      setLearnFocus(chipId ?? null);
      setLearnOpen(true);
    }
    function addKeep(event: Event) {
      const chip = (event as CustomEvent<HarvestChip>).detail;
      if (!chip?.id) return;
      if (existingDueHarvest(readKeepChips(), chip)) return;
      addKeepChip(chip);
    }
    function resetKeep() {
      clearKeepChips();
    }
    window.addEventListener("halo-learn-open", openLearn);
    window.addEventListener("halo-keep-add", addKeep);
    window.addEventListener("halo-keep-reset", resetKeep);
    return () => {
      window.removeEventListener("halo-learn-open", openLearn);
      window.removeEventListener("halo-keep-add", addKeep);
      window.removeEventListener("halo-keep-reset", resetKeep);
    };
  }, []);

  return (
    <>
    <ChromeBar className="topbar">
      {showHome ? (
        <div className="topbar-title">
          <Link
            href={homeHref}
            className="stone-btn"
            onClick={(event) => {
              if (!onGoHome) return;
              event.preventDefault();
              onGoHome();
            }}
          >
            ←<span className="topbar-home-label"> Home</span>
          </Link>
          <div className="topbar-heading">
            <div className="brand-row">
              <p className="brand-mark brand-mark--sm">{APP_NAME}</p>
              <GoldKeptBadge chips={keep} />
            </div>
            {title ? <h1 className="chat-title">{title}</h1> : null}
          </div>
        </div>
      ) : (
        <span className="brand-row">
          <span className="brand-mark brand-mark--sm">{APP_NAME}</span>
          <GoldKeptBadge chips={keep} />
        </span>
      )}
      <div className="topbar-actions">
        <KeepPocket chips={keep} />
        <LibraryMenu demo={demo} />
        <HistoryMenu
          items={conversations}
          currentId={currentId}
          demo={demo}
          onSelect={onOpenChat}
          onDeleted={onDeleted}
        />
        <SettingsMenu profile={profile} demo={demo} />
      </div>
    </ChromeBar>
    {learnOpen ? (
    <LearnReview
      demo={demo}
      open
      focusId={learnFocus}
      onClose={() => setLearnOpen(false)}
      onFinished={(next) => {
        window.dispatchEvent(
          new CustomEvent("halo-learn-finished", { detail: next })
        );
      }}
    />
    ) : null}
    </>
  );
}
