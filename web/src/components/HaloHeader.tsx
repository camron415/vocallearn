"use client";

import Link from "next/link";
import { HistoryMenu, type HistoryItem } from "@/components/HistoryMenu";
import { ModeMenu } from "@/components/ModeMenu";
import { SettingsMenu } from "@/components/SettingsMenu";
import { captureComposeMorph } from "@/components/SpringStage";
import { WaterPane } from "@/components/WaterSurface";
import { APP_NAME } from "@/lib/constants";
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
}) {
  return (
    <WaterPane as="header" variant="bar" className="topbar">
      {showHome ? (
        <div className="topbar-title">
          <Link
            href={homeHref}
            className="stone-btn"
            onClick={() => captureComposeMorph(null)}
          >
            ←<span className="topbar-home-label"> Home</span>
          </Link>
          <div className="topbar-heading">
            <p className="brand-mark brand-mark--sm">{APP_NAME}</p>
            {title ? <h1 className="chat-title">{title}</h1> : null}
          </div>
        </div>
      ) : (
        <span className="brand-mark brand-mark--sm">{APP_NAME}</span>
      )}
      <div className="topbar-actions">
        <div data-tour="history">
          <HistoryMenu
            items={conversations}
            currentId={currentId}
            demo={demo}
            onSelect={onOpenChat}
            onDeleted={onDeleted}
          />
        </div>
        <ModeMenu demo={demo} />
        <SettingsMenu profile={profile} demo={demo} />
      </div>
    </WaterPane>
  );
}
