"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SCREENS = [
  { id: "home", label: "Home" },
  { id: "chat", label: "Chat dock" },
] as const;

export function PreviewSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const screen = params.get("view") === "chat" ? "chat" : "home";

  function setScreen(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "home") next.delete("view");
    else next.set("view", value);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="preview-switcher" role="region" aria-label="Preview options">
      <div className="preview-switcher__group">
        {SCREENS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={screen === item.id ? "is-on" : ""}
            onClick={() => setScreen(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
