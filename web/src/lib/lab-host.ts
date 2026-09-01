/** Local dev + LAN preview hosts (Mix tools, dev APIs, Lab QA). */
export function isLabHost(hostname: string) {
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") {
    return true;
  }
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  return false;
}

export function isLabBrowserHost() {
  if (typeof window === "undefined") return false;
  return isLabHost(window.location.hostname);
}
