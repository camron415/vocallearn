"use client";

import { useEffect, useState } from "react";
import { GlassButton } from "@/components/Glass";
import { MenuSheet } from "@/components/MenuSheet";
import { SimpleSheet } from "@/components/SimpleSheet";
import { useCoarsePointer } from "@/lib/coarse-pointer";

export type HistoryItem = { id: string; title: string };

/** Lab (`demo`) History only reports the id. The parent must stay on `/preview`
 *  — never `/ask/:id`. Family History still opens a real thread. */

export function HistoryMenu({
  items,
  currentId,
  demo = false,
  onSelect,
  onDeleted,
}: {
  items: HistoryItem[];
  currentId?: string;
  demo?: boolean;
  onSelect: (id: string) => void;
  onDeleted?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(items);
  const [editing, setEditing] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const coarse = useCoarsePointer();

  useEffect(() => {
    setRows(items);
  }, [items]);

  useEffect(() => {
    if (!open) {
      setEditing(false);
      setPicked([]);
      setBusy(false);
    }
  }, [open]);

  /** Escape backs out of pick mode first, then closes the sheet. */
  function onEscape() {
    if (editing) {
      setEditing(false);
      setPicked([]);
      return;
    }
    setOpen(false);
  }

  function togglePick(id: string) {
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id]
    );
  }

  async function removePicked() {
    if (busy || picked.length === 0) return;
    setBusy(true);
    try {
      if (!demo) {
        const res = await fetch("/api/chats", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: picked }),
        });
        if (!res.ok) return;
      }
      const removed = new Set(picked);
      setRows((prev) => prev.filter((row) => !removed.has(row.id)));
      for (const id of picked) onDeleted?.(id);
      if (currentId && removed.has(currentId)) setOpen(false);
      setPicked([]);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  const body =
    rows.length === 0 ? (
      <p className="history-empty">No chats yet. Ask something to start one.</p>
    ) : (
      <section className="menu-block">
        <div className="menu-block-head">
          <p className="field-label">
            {editing ? "Choose chats to remove" : "Chats"}
          </p>
          <div className="history-toolbar">
            {editing ? (
              <>
                <GlassButton
                  onClick={() => {
                    setEditing(false);
                    setPicked([]);
                  }}
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  disabled={busy || picked.length === 0}
                  title="Remove selected chats"
                  onClick={() => void removePicked()}
                >
                  {picked.length ? `Remove ${picked.length}` : "Remove"}
                </GlassButton>
              </>
            ) : (
              <GlassButton
                title="Choose chats to remove"
                onClick={() => setEditing(true)}
              >
                Remove
              </GlassButton>
            )}
          </div>
        </div>
        <ul className="history-list">
          {rows.map((item) => {
            const on = picked.includes(item.id);
            return (
              <li key={item.id} className="history-row">
                {editing ? (
                  <button
                    type="button"
                    className={`history-pick${on ? " is-on" : ""}`}
                    aria-pressed={on}
                    aria-label={on ? "Deselect chat" : "Select chat"}
                    onClick={() => togglePick(item.id)}
                  />
                ) : null}
                <button
                  type="button"
                  className={`history-item${
                    item.id === currentId ? " is-current" : ""
                  }${on ? " is-picked" : ""}`}
                  onClick={() => {
                    if (editing) {
                      togglePick(item.id);
                      return;
                    }
                    setOpen(false);
                    onSelect(item.id);
                  }}
                >
                  {item.title || "Untitled"}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );

  const sheetProps = {
    open,
    onClose: () => setOpen(false),
    onEscape,
    title: "History",
    titleId: "history-title",
  };

  return (
    <div className="history-wrap">
      <GlassButton
        title="Open chat history"
        onClick={() => setOpen(true)}
      >
        <span className="topbar-action-label">History</span>
        <svg
          className="topbar-action-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="8.25" />
          <path d="M12 7.5V12l3.25 3.25" />
        </svg>
      </GlassButton>
      {coarse ? (
        <SimpleSheet {...sheetProps}>{body}</SimpleSheet>
      ) : (
        <MenuSheet {...sheetProps}>{body}</MenuSheet>
      )}
    </div>
  );
}
