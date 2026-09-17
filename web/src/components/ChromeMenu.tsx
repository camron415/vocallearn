"use client";

import { useState } from "react";
import { GlassButton } from "@/components/Glass";
import { HistoryMenu, type HistoryItem } from "@/components/HistoryMenu";
import { LibraryMenu } from "@/components/LibraryMenu";
import { SettingsMenu } from "@/components/SettingsMenu";
import { SimpleSheet } from "@/components/SimpleSheet";
import type { HaloProfile } from "@/lib/types";

export function ChromeMenu({
  conversations = [],
  currentId,
  demo = false,
  profile,
  onOpenChat,
  onDeleted,
}: {
  conversations?: HistoryItem[];
  currentId?: string;
  demo?: boolean;
  profile?: HaloProfile;
  onOpenChat: (id: string) => void;
  onDeleted?: (id: string) => void;
}) {
  const [hub, setHub] = useState(false);
  const [panel, setPanel] = useState<"history" | "settings" | "library" | null>(
    null
  );

  return (
    <div className="history-wrap chrome-menu" data-saves-pocket>
      <GlassButton title="Open menu" onClick={() => setHub(true)}>
        <span className="topbar-action-label">Menu</span>
        <svg
          className="topbar-action-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </GlassButton>
      <SimpleSheet
        open={hub}
        onClose={() => setHub(false)}
        title="Menu"
        titleId="chrome-menu-title"
        cardClassName="settings-page"
      >
        <section className="settings-block">
          <button
            type="button"
            className="history-item"
            onClick={() => {
              setHub(false);
              setPanel("history");
            }}
          >
            History
          </button>
          <button
            type="button"
            className="history-item"
            onClick={() => {
              setHub(false);
              setPanel("library");
            }}
          >
            Library
          </button>
          <button
            type="button"
            className="history-item"
            onClick={() => {
              setHub(false);
              setPanel("settings");
            }}
          >
            Settings
          </button>
        </section>
      </SimpleSheet>
      <HistoryMenu
        items={conversations}
        currentId={currentId}
        demo={demo}
        hideTrigger
        open={panel === "history"}
        onOpenChange={(next) => setPanel(next ? "history" : null)}
        onSelect={onOpenChat}
        onDeleted={onDeleted}
      />
      <LibraryMenu
        demo={demo}
        hideTrigger
        open={panel === "library"}
        onOpenChange={(next) => setPanel(next ? "library" : null)}
      />
      <SettingsMenu
        profile={profile}
        demo={demo}
        hideTrigger
        open={panel === "settings"}
        onOpenChange={(next) => setPanel(next ? "settings" : null)}
      />
    </div>
  );
}
