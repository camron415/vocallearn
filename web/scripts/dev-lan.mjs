import { spawn, execSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const web = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 3000;

function killPort(port) {
  try {
    const out = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`, {
      encoding: "utf8",
    });
    for (const pid of out.trim().split(/\s+/).filter(Boolean)) {
      try {
        process.kill(Number(pid), "SIGKILL");
      } catch {
        /* gone */
      }
    }
  } catch {
    /* nothing listening */
  }
}

function lanIps() {
  const ips = new Set();
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const net of nets ?? []) {
      if (net.family === "IPv4" && !net.internal) {
        ips.add(net.address);
      }
    }
  }
  return [...ips];
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/api/dev/ping`, {
        cache: "no-store",
      });
      if (res.ok) return true;
    } catch {
      /* starting */
    }
    await wait(500);
  }
  return false;
}

killPort(PORT);
await wait(400);

const ips = lanIps();
const primary = ips.find((ip) => ip.startsWith("192.168.")) ?? ips[0];

console.log("\n══════════════════════════════════════════════════");
console.log("  Cove LAN dev — iPhone must use http (not https)");
console.log("══════════════════════════════════════════════════\n");
console.log("1. Mac + iPhone on the SAME Wi‑Fi (not guest / hotspot).");
console.log("2. Turn VPN off on both devices.");
console.log("3. Stop any other dev server (npm run preview) first.\n");

if (primary) {
  console.log("On iPhone Safari, try IN ORDER:\n");
  console.log(`   Ping:  http://${primary}:${PORT}/api/dev/ping`);
  console.log(`         → should show {"ok":true,...}\n`);
  console.log(`   Login: http://${primary}:${PORT}/login`);
  console.log(`   Ask:   http://${primary}:${PORT}/ask\n`);
  if (ips.length > 1) {
    console.log("Other Mac IPs (if the first fails):");
    for (const ip of ips) console.log(`   http://${ip}:${PORT}/api/dev/ping`);
    console.log("");
  }
} else {
  console.log("Could not detect a LAN IP. System Settings → Network → Wi‑Fi → Details.\n");
}

console.log("If ping never loads: router may block phone→Mac (AP isolation).");
console.log("Use npm run deploy:lab instead — works on any network.\n");
console.log("Starting Next on 0.0.0.0:" + PORT + " …\n");

const child = spawn(
  "npm",
  ["run", "dev", "--", "--hostname", "0.0.0.0", "--port", String(PORT)],
  { stdio: "inherit", shell: true, cwd: web }
);

void (async () => {
  const up = await waitForServer();
  if (up && primary) {
    try {
      const res = await fetch(`http://${primary}:${PORT}/api/dev/ping`, {
        cache: "no-store",
      });
      const body = await res.json();
      if (body.ok) {
        console.log(`\n✓ Mac can reach LAN URL: http://${primary}:${PORT}/api/dev/ping\n`);
      }
    } catch {
      console.log("\n⚠ Server is up on localhost but Mac cannot curl the LAN IP.");
      console.log("  iPhone will likely fail too — use deploy:lab.\n");
    }
  }
})();

child.on("exit", (code) => process.exit(code ?? 0));
