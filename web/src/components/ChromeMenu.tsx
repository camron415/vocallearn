"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAskShell } from "@/components/AskShell";
import { GlassButton } from "@/components/Glass";
import type { HistoryItem } from "@/components/HistoryMenu";
import { LibraryMenu } from "@/components/LibraryMenu";
import { SettingsMenu } from "@/components/SettingsMenu";
import { SimpleSheet } from "@/components/SimpleSheet";
import { isLabPreviewPath } from "@/lib/lab-preview";
import type { HaloProfile } from "@/lib/types";

function MenuMark({ back = false }: { back?: boolean }) {
  return (
    <span className={`menu-mark${back ? " is-x" : ""}`} aria-hidden>
      <span />
      <span />
    </span>
  );
}

function quietWhen(iso: string | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ChromeMenu({
  conversations = [],
  currentId,
  demo = false,
  profile,
  onOpenChat,
  onDeleted: _onDeleted,
}: {
  conversations?: HistoryItem[];
  currentId?: string;
  demo?: boolean;
  profile?: HaloProfile;
  onOpenChat: (id: string) => void | Promise<void>;
  onDeleted?: (id: string) => void;
}) {
  const shell = useAskShell();
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<"settings" | "library" | null>(null);
  const [busy, setBusy] = useState(false);
  const pendingChat = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    return () => {
      delete document.documentElement.dataset.haloMenuLeave;
      delete document.documentElement.dataset.haloMenuChat;
    };
  }, []);

  function releaseMenuFocus() {
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.closest(".chrome-menu")) {
      active.blur();
    }
  }

  function close() {
    releaseMenuFocus();
    setOpen(false);
    if (!pendingChat.current) setBusy(false);
  }

  const onMenuExited = useCallback(() => {
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.closest(".chrome-menu")) {
        active.blur();
      }
    });
    const job = pendingChat.current;
    if (!job) return;
    void job.then((ok) => {
      if (pendingChat.current !== job) return;
      pendingChat.current = null;
      setBusy(false);
      delete document.documentElement.dataset.haloMenuLeave;
      if (!ok) return;
      document.documentElement.dataset.haloMenuChat = "1";
      window.setTimeout(() => {
        delete document.documentElement.dataset.haloMenuChat;
      }, 220);
    });
  }, []);

  async function pick(id: string) {
    if (busy) return;
    if (demo || isLabPreviewPath()) {
      await onOpenChat(id);
      close();
      return;
    }
    if (document.documentElement.dataset.haloNative === "1" && shell?.openLive) {
      setBusy(true);
      document.documentElement.dataset.haloMenuLeave = "1";
      const job = shell.openLive(id);
      pendingChat.current = job;
      setOpen(false);
      return;
    }
    await onOpenChat(id);
    close();
  }

  return (
    <div className="history-wrap chrome-menu" data-saves-pocket>
      <GlassButton
        title={open ? "Close menu" : "Open menu"}
        className={open ? "is-open" : ""}
        onClick={() => {
          if (open) {
            close();
            return;
          }
          setPanel(null);
          setOpen(true);
        }}
      >
        <span className="topbar-action-label">Menu</span>
        <MenuMark />
      </GlassButton>
      <SimpleSheet
        open={open}
        onClose={close}
        title="Menu"
        titleId="chrome-menu-title"
        dim
        onExited={onMenuExited}
        cardClassName={panel === "settings" ? "settings-page" : undefined}
      >
        <div className="phone-menu-lock">
        <div className="phone-menu-tools">
          <button
            type="button"
            className="phone-menu-tool"
            aria-pressed={panel === "settings"}
            onClick={() => setPanel(panel === "settings" ? null : "settings")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Settings</span>
          </button>
          <button
            type="button"
            className="phone-menu-tool"
            aria-pressed={panel === "library"}
            onClick={() => setPanel(panel === "library" ? null : "library")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 4.5h9a2 2 0 0 1 2 2V19l-6.5-3.2L4 19V6.5a2 2 0 0 1 2-2z" />
            </svg>
            <span>Library</span>
          </button>
          <button
            type="button"
            className="phone-menu-tool phone-menu-tool--menu"
            aria-pressed="true"
            title="Close menu"
            onClick={close}
          >
            <MenuMark back />
          </button>
        </div>
        {panel == null ? <h2 className="phone-menu-heading">Chats</h2> : null}
        </div>
        <div className={`phone-menu-body${panel == null ? "" : " is-off"}`}>
            <ul className="phone-menu-chats">
              {conversations.map((item) => {
                const when = quietWhen(item.updated_at);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`phone-menu-chat${
                        item.id === currentId ? " is-current" : ""
                      }`}
                      onClick={() => void pick(item.id)}
                    >
                      <span className="phone-menu-chat-title">
                        {item.title || "Untitled"}
                      </span>
                      {when ? (
                        <span className="phone-menu-chat-time">{when}</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
            {conversations.length === 0 ? (
              <p className="phone-menu-empty">No chats yet.</p>
            ) : null}
        </div>
        <div className={`phone-menu-body${panel === "settings" ? "" : " is-off"}`}>
          <SettingsMenu
            profile={profile}
            demo={demo}
            hideTrigger
            embedded
            open
          />
        </div>
        <div className={`phone-menu-body${panel === "library" ? "" : " is-off"}`}>
          <LibraryMenu demo={demo} hideTrigger embedded open />
        </div>
      </SimpleSheet>
    </div>
  );
}
