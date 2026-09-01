import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const web = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function killPort(port) {
  try {
    const out = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`, {
      encoding: "utf8",
    });
    for (const pid of out.trim().split(/\s+/).filter(Boolean)) {
      try {
        process.kill(Number(pid), "SIGKILL");
      } catch {
        /* already gone */
      }
    }
  } catch {
    /* nothing listening */
  }
}

killPort(3000);
killPort(8791);
fs.rmSync(path.join(web, ".next"), { recursive: true, force: true });
await new Promise((r) => setTimeout(r, 400));

const sink = spawn("node", ["scripts/harvest-sink.mjs"], {
  cwd: web,
  stdio: "inherit",
});
const dev = spawn("npm", ["run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"], {
  cwd: web,
  stdio: "inherit",
});

function shutdown() {
  sink.kill("SIGTERM");
  dev.kill("SIGTERM");
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});
process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

const lost = (child, name) => {
  child.on("exit", (code) => {
    if (code) console.error(`${name} exited ${code}`);
  });
};
lost(sink, "capture-sink");
lost(dev, "next");

function lanIps() {
  const ips = new Set();
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const net of nets ?? []) {
      if (net.family === "IPv4" && !net.internal) ips.add(net.address);
    }
  }
  return [...ips];
}

void (async () => {
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch("http://127.0.0.1:3000/api/dev/ping", { cache: "no-store" });
      if (res.ok) break;
    } catch {
      /* starting */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  const ips = lanIps();
  const primary = ips.find((ip) => ip.startsWith("192.168.")) ?? ips[0];
  if (primary) {
    console.log(`\nLAN (iPhone Safari): http://${primary}:3000/login`);
    console.log(`LAN ping test:      http://${primary}:3000/api/dev/ping\n`);
  }
})();
