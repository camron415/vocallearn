import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
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
const dev = spawn("npm", ["run", "dev", "--", "--port", "3000"], {
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
