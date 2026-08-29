"use client";

/**
 * Ask is the only mode on the header for now. Recipes / lists will live
 * somewhere else; Learn is Keep review, not its own category.
 */
export function ModeMenu() {
  return (
    <div className="history-wrap">
      <span className="stone-btn" aria-current="page">
        Ask
      </span>
    </div>
  );
}
