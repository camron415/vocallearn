/** Browser-facing origin — never 0.0.0.0 (Safari blocks it on LAN dev). */
export function publicOrigin(request: Request): string {
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host")?.trim();
  if (host) {
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      (host.startsWith("localhost") ||
      host.startsWith("127.0.0.1") ||
      /^\d+\.\d+\.\d+\.\d+/.test(host.split(":")[0])
        ? "http"
        : "https");
    return `${proto}://${host}`;
  }

  const url = new URL(request.url);
  if (url.hostname === "0.0.0.0" || url.hostname === "[::]") {
    return `http://localhost:${url.port || "3000"}`;
  }
  return url.origin;
}

export function publicUrl(request: Request, path: string): URL {
  return new URL(path, publicOrigin(request));
}
