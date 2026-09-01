import fs from "node:fs/promises";
import path from "node:path";

export type CapturePayload = {
  meta: Record<string, unknown>;
  frames: { name: string; jpeg: string }[];
};

function captureRoot(surface: string) {
  const folder = surface === "home" ? "home" : "harvest";
  return path.join(process.cwd(), "captures", folder);
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export async function writeHarvestCapture(payload: CapturePayload) {
  const surface =
    typeof payload.meta.surface === "string" ? payload.meta.surface : "harvest";
  const folder = surface === "home" ? "home" : "harvest";
  const root = captureRoot(surface);
  const id = stamp();
  const runDir = path.join(root, id);
  const latest = path.join(root, "latest");
  await fs.mkdir(runDir, { recursive: true });
  await fs.rm(latest, { recursive: true, force: true });
  await fs.mkdir(latest, { recursive: true });

  for (const frame of payload.frames.slice(0, 96)) {
    const match = /^data:image\/jpeg;base64,(.+)$/.exec(frame.jpeg);
    if (!match) continue;
    const buf = Buffer.from(match[1], "base64");
    const file = `${frame.name}.jpg`;
    await fs.writeFile(path.join(runDir, file), buf);
    await fs.writeFile(path.join(latest, file), buf);
  }

  const meta = {
    ...payload.meta,
    id,
    dir: `web/captures/${folder}/latest`,
  };
  const metaText = JSON.stringify(meta, null, 2);
  await fs.writeFile(path.join(runDir, "meta.json"), metaText);
  await fs.writeFile(path.join(latest, "meta.json"), metaText);
  return { id, dir: `web/captures/${folder}/latest` };
}
