import type { NextConfig } from "next";
import path from "path";

const noStore = [
  { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
  { key: "Pragma", value: "no-cache" },
  { key: "Expires", value: "0" },
];

const nextConfig: NextConfig = {
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
