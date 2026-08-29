"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { GlassButton } from "@/components/Glass";

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
  const [mounted, setMounted] = useState(false);
  const [rows, setRows] = useState(items);
  const [editing, setEditing] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (editing) {
          setEditing(false);
          setPicked([]);
          return;
        }
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, editing]);

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

  const page = open ? (
    <div
      className="history-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-title"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="history-page">
        <div className="history-page-head">
          <h1 id="history-title" className="history-page-title">
            History
          </h1>
          <GlassButton onClick={() => setOpen(false)}>Close</GlassButton>
        </div>
        {rows.length === 0 ? (
          <p className="history-empty">No chats yet. Ask something to start one.</p>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="history-wrap">
      <GlassButton
        title="Open chat history"
        onClick={() => setOpen((v) => !v)}
      >
        History
      </GlassButton>
      {mounted && page ? createPortal(page, document.body) : null}
    </div>
  );
}
