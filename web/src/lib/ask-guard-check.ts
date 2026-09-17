import { validateAskAttachments } from "@/lib/files";
import { estimateTurnMicros } from "@/lib/ask-guard";
import { ASK_DAILY_FILE_CAP, ASK_DAILY_MESSAGE_CAP, ASK_MESSAGE_MAX_CHARS } from "@/lib/limits";

export function runAskGuardFixtures(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];

  if (ASK_MESSAGE_MAX_CHARS > 4000) {
    failures.push("compose cap should stay tight");
  }
  if (ASK_DAILY_MESSAGE_CAP < 1) failures.push("daily message cap missing");
  if (ASK_DAILY_FILE_CAP < 1) failures.push("daily file cap missing");

  const luna = estimateTurnMicros({
    provider: "luna",
    files: 0,
    search: false,
  });
  const grokSearch = estimateTurnMicros({
    provider: "grok",
    files: 0,
    search: true,
  });
  if (!(luna > 0 && grokSearch > luna)) {
    failures.push("Grok+search reserve should cost more than Luna");
  }

  const tooMany = validateAskAttachments([
    { name: "a.jpg", type: "image/jpeg", data: "xx" },
    { name: "b.jpg", type: "image/jpeg", data: "xx" },
    { name: "c.jpg", type: "image/jpeg", data: "xx" },
    { name: "d.jpg", type: "image/jpeg", data: "xx" },
  ]);
  if (tooMany.ok) failures.push("should reject more than 3 files");

  const badJpeg = validateAskAttachments([
    { name: "x.jpg", type: "image/jpeg", data: Buffer.from("not-a-jpeg").toString("base64") },
  ]);
  if (badJpeg.ok) failures.push("should reject spoofed jpeg");

  return { ok: failures.length === 0, failures };
}
