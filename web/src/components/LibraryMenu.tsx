"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassButton } from "@/components/Glass";
import { MenuSheet } from "@/components/MenuSheet";
import { SimpleSheet } from "@/components/SimpleSheet";
import { useCoarsePointer } from "@/lib/coarse-pointer";

export function LibraryMenu({ demo = false }: { demo?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const coarse = useCoarsePointer();
  const Sheet = coarse ? SimpleSheet : MenuSheet;

  return (
    <div className="history-wrap" data-saves-pocket>
      <GlassButton title="Open library" onClick={() => setOpen(true)}>
        <span className="topbar-action-label">Library</span>
        <svg
          className="topbar-action-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </GlassButton>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Library"
        titleId="library-title"
        cardClassName="settings-page"
      >
        <section className="settings-block settings-block--end">
          <p className="field-label">Saved recipes</p>
          <p className="login-sub">
            Recipes you saved from chat. After a cooking answer, tap{" "}
            <strong>Save this recipe</strong> under the reply.
          </p>
          <GlassButton
            onClick={() => {
              if (demo) return;
              setOpen(false);
              router.push("/recipes");
            }}
            disabled={demo}
          >
            {demo ? "Preview only" : "Open saved recipes"}
          </GlassButton>
        </section>
      </Sheet>
    </div>
  );
}
