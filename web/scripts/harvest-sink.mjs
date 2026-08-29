import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const captures = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "captures");
const PORT = 8791;

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Private-Network", "true");
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function writeCapture(payload) {
  const folder = payload?.meta?.surface === "home" ? "home" : "harvest";
  const root = path.join(captures, folder);
  const id = stamp();
  const runDir = path.join(root, id);
  const latest = path.join(root, "latest");
  await fs.mkdir(runDir, { recursive: true });
  await fs.rm(latest, { recursive: true, force: true });
  await fs.mkdir(latest, { recursive: true });
  for (const frame of (payload.frames || []).slice(0, 96)) {
    const match = /^data:image\/jpeg;base64,(.+)$/.exec(frame.jpeg || "");
    if (!match) continue;
    const buf = Buffer.from(match[1], "base64");
    const file = `${frame.name}.jpg`;
    await fs.writeFile(path.join(runDir, file), buf);
    await fs.writeFile(path.join(latest, file), buf);
  }
  const meta = {
    ...(payload.meta || {}),
    id,
    dir: `web/captures/${folder}/latest`,
    sink: "mac-sink",
  };
  const text = JSON.stringify(meta, null, 2);
  await fs.writeFile(path.join(runDir, "meta.json"), text);
  await fs.writeFile(path.join(latest, "meta.json"), text);
  return { id, dir: `web/captures/${folder}/latest` };
}

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  if (req.method === "POST" && req.url === "/harvest-capture") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    try {
      const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      const saved = await writeCapture(payload);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, ...saved }));
    } catch (error) {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: String(error) }));
    }
    return;
  }
  res.writeHead(404);
  res.end("not found");
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log("Capture sink already listening on http://127.0.0.1:8791");
    return;
  }
  throw err;
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Capture sink writing to ${captures}/{harvest|home} on http://127.0.0.1:${PORT}`);
});
