import { grokAuth, type GrokContentPart } from "@/lib/grok";
import type { ChatAttachment } from "@/lib/types";

export const MAX_ATTACH_BYTES = 4 * 1024 * 1024;
export const MAX_ATTACH_FILES = 3;

const IMAGE = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const TEXT = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
]);

const DOCS = new Set(["application/pdf", ...TEXT]);

export function acceptAttr() {
  return "image/jpeg,image/png,image/webp,image/gif,.pdf,.txt,.md,.csv,.json";
}

export function isAllowedFile(file: { name: string; type: string }) {
  const type = file.type || guessType(file.name);
  return IMAGE.has(type) || DOCS.has(type);
}

function guessType(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "txt") return "text/plain";
  if (ext === "md") return "text/markdown";
  if (ext === "csv") return "text/csv";
  if (ext === "json") return "application/json";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "";
}

function decode(data: string) {
  return Buffer.from(data, "base64");
}

async function uploadXaiFile(name: string, type: string, bytes: Buffer) {
  const { apiUrl, apiKey } = grokAuth();
  const form = new FormData();
  form.append("purpose", "assistants");
  form.append("expires_after", "86400");
  form.append(
    "file",
    new Blob([new Uint8Array(bytes)], { type: type || "application/octet-stream" }),
    name
  );

  const res = await fetch(`${apiUrl}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Could not upload file");
  }
  const data = (await res.json()) as { id?: string };
  if (!data.id) throw new Error("File upload did not return an id");
  return data.id;
}

export async function attachmentsToGrokParts(
  attachments: ChatAttachment[]
): Promise<GrokContentPart[]> {
  const parts: GrokContentPart[] = [];

  for (const file of attachments.slice(0, MAX_ATTACH_FILES)) {
    const type = file.type || guessType(file.name);
    const bytes = decode(file.data);
    if (bytes.length > MAX_ATTACH_BYTES) {
      throw new Error(`${file.name} is too large (max 4 MB)`);
    }

    if (IMAGE.has(type)) {
      parts.push({
        type: "input_image",
        image_url: `data:${type};base64,${file.data}`,
        detail: "low",
      });
      continue;
    }

    if (TEXT.has(type)) {
      parts.push({
        type: "input_text",
        text: `Attached file ${file.name}:\n${bytes.toString("utf8").slice(0, 20000)}`,
      });
      continue;
    }

    if (type === "application/pdf" || DOCS.has(type)) {
      const id = await uploadXaiFile(file.name, type, bytes);
      parts.push({ type: "input_file", file_id: id });
    }
  }

  return parts;
}

export function attachmentNote(attachments: ChatAttachment[]) {
  if (!attachments.length) return "";
  const names = attachments.map((f) => f.name).join(", ");
  return `\n\n[Attached: ${names}]`;
}
