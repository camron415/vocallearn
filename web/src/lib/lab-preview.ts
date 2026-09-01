/** Lab `/preview` must never fall through to frozen family `/ask`. */

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
