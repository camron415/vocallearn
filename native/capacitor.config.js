/** @type {import('@capacitor/cli').CapacitorConfig} */

const fs = require("fs");
const os = require("os");
const path = require("path");

function lanAddress() {
  const nets = os.networkInterfaces();
  for (const name of ["en0", "en1", ...Object.keys(nets)]) {
    for (const row of nets[name] || []) {
      const family = String(row.family);
      if ((family === "IPv4" || family === "4") && !row.internal) {
        return row.address;
      }
    }
  }
  return null;
}

function labPreviewOrigin() {
  try {
    const raw = fs
      .readFileSync(path.join(__dirname, "lab-origin.txt"), "utf8")
      .trim()
      .replace(/\/$/, "");
    if (raw.startsWith("https://")) return raw;
  } catch {
    /* no lab URL yet */
  }
  return null;
}

const fromEnv = (process.env.HALO_NATIVE_ORIGIN || "").replace(/\/$/, "");
const lan = lanAddress();
const live = "https://halo-gules-three.vercel.app";
const labFile = labPreviewOrigin();
const ORIGIN =
  fromEnv === "prod"
    ? live
    : fromEnv === "lan" && lan
      ? `http://${lan}:3000`
      : fromEnv
        ? fromEnv
        : labFile || live;

const isHttp = ORIGIN.startsWith("http://");
const originHost = ORIGIN.replace(/^https?:\/\//, "").split("/")[0];

const config = {
  appId: "com.camrontrost.halo",
  appName: "Halo",
  webDir: "www",
  server: {
    url: ORIGIN,
    cleartext: isHttp,
    allowNavigation: [
      originHost,
      "halo-gules-three.vercel.app",
      "*.vercel.app",
      "*.supabase.co",
      "accounts.google.com",
      "appleid.apple.com",
    ].filter(Boolean),
  },
  ios: {
    contentInset: "never",
    preferredContentMode: "mobile",
    backgroundColor: "#fafaf9",
    scheme: "halo",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 400,
      launchAutoHide: true,
      backgroundColor: "#fafaf9",
      showSpinner: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#fafaf9",
    },
  },
};

module.exports = config;
