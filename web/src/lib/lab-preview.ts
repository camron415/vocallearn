/** Lab `/preview` must never fall through to frozen family `/ask`. */

/** Mixer rail: localhost always; production only with `?mixer=1`. */
export function showPreviewMixer(mixer?: string) {
  if (process.env.NODE_ENV === "development") return true;
  return mixer === "1";
}

export function isLabPreviewPath(pathname?: string) {
  const path =
    pathname ??
    (typeof window === "undefined" ? "" : window.location.pathname);
  return path === "/preview" || path.startsWith("/preview/");
}

export function labPreviewChatHref(threadId?: string) {
  const next = new URLSearchParams(
    typeof window === "undefined" ? "" : window.location.search
  );
  next.set("view", "chat");
  if (threadId) next.set("thread", threadId);
  return `/preview?${next.toString()}`;
}

export function labPreviewHomeHref() {
  const next = new URLSearchParams(
    typeof window === "undefined" ? "" : window.location.search
  );
  next.delete("view");
  next.delete("thread");
  const q = next.toString();
  return q ? `/preview?${q}` : "/preview";
}
