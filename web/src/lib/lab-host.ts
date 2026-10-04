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

/** The phone lab alias and its preview hosts. Not the family site. */
export function isPhoneLabHost() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "halo-lab-personal-f999.vercel.app" || host.endsWith("-personal-f999.vercel.app");
}
