import type { NextConfig } from "next";
import os from "os";
import path from "path";

const noStore = [
  { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
  { key: "Pragma", value: "no-cache" },
  { key: "Expires", value: "0" },
];

/** Next 16 blocks /_next chunks from LAN IPs unless listed. iPhone then
 *  paints HTML/CSS with no hydration — buttons highlight, clicks do nothing. */
function lanDevOrigins() {
  const origins = new Set([
    "localhost",
    "127.0.0.1",
    "[::1]",
    "192.168.*.*",
    "10.*.*.*",
    "172.*.*.*",
  ]);
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const net of nets ?? []) {
      if (net.family === "IPv4" && !net.internal) origins.add(net.address);
    }
  }
  return [...origins];
}

const nextConfig: NextConfig = {
  allowedDevOrigins: lanDevOrigins(),
  turbopack: {
    root: path.join(__dirname),
  },
  async headers() {
    if (process.env.NODE_ENV === "development") {
      return [{ source: "/:path*", headers: noStore }];
    }
    return [
      { source: "/preview", headers: noStore },
      { source: "/preview/:path*", headers: noStore },
    ];
  },
};

export default nextConfig;
