/** Lab-only persistent composer. Production `/ask` stays frozen. */

export function isAskShellLab() {
  if (process.env.NEXT_PUBLIC_HALO_ASK_SHELL === "0") return false;
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  if (path === "/preview" || path.startsWith("/preview/")) return true;
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === "production") return false;
  return path === "/ask" || path.startsWith("/ask/");
}
