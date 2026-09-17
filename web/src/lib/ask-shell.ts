/** Lab-only persistent composer. Family `/ask` stays frozen. */

export function isAskShellLab() {
  if (process.env.NEXT_PUBLIC_HALO_ASK_SHELL === "0") return false;
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  return path === "/preview" || path.startsWith("/preview/");
}
