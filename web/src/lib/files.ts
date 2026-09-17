import { grokAuth, type GrokContentPart } from "@/lib/grok";
import type { ChatAttachment } from "@/lib/types";

export const MAX_ATTACH_BYTES = 4 * 1024 * 1024;
export const MAX_ATTACH_FILES = 3;
export const MAX_TEXT_ATTACH_CHARS = 8000;
export const MAX_PDF_FILES = 1;
export const MAX_ATTACH_TOTAL_BYTES = 8 * 1024 * 1024;

/** xAI image understanding accepts jpeg/png only. Client transcodes the rest. */
const IMAGE = new Set(["image/jpeg", "image/jpg", "image/png"]);

const IMAGE_IN = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

const TEXT = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
]);

const DOCS = new Set(["application/pdf", ...TEXT]);

export function acceptAttr() {
  return "image/*,.heic,.heif,.pdf,.txt,.md,.csv,.json";
}

export function isAllowedFile(file: { name: string; type: string }) {
  const type = (file.type || guessType(file.name)).toLowerCase();
  return IMAGE_IN.has(type) || IMAGE.has(type) || DOCS.has(type);
}

export function isImageFile(file: { name: string; type: string }) {
  const type = (file.type || guessType(file.name)).toLowerCase();
  return type.startsWith("image/") || IMAGE_IN.has(type);
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
  if (ext === "heic") return "image/heic";
  if (ext === "heif") return "image/heif";
  return "";
}

function decode(data: string) {
  return Buffer.from(data, "base64");
}

function looksLikeJpeg(bytes: Buffer) {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function looksLikePng(bytes: Buffer) {
  return (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  );
}

function looksLikePdf(bytes: Buffer) {
  return bytes.length > 4 && bytes.subarray(0, 4).toString("ascii") === "%PDF";
}

export function validateAskAttachments(
  attachments: ChatAttachment[]
): { ok: true; files: ChatAttachment[] } | { ok: false; error: string } {
  if (attachments.length > MAX_ATTACH_FILES) {
    return { ok: false, error: `At most ${MAX_ATTACH_FILES} files per message.` };
  }

  let total = 0;
  let pdfs = 0;
  const files: ChatAttachment[] = [];

  for (const file of attachments) {
    const name = String(file.name || "file").slice(0, 180);
    const type = (file.type || guessType(name)).toLowerCase();
    const data = typeof file.data === "string" ? file.data : "";
    if (!data || data.length > MAX_ATTACH_BYTES * 2) {
      return { ok: false, error: `${name} is too large (max 4 MB).` };
    }
    let bytes: Buffer;
    try {
      bytes = decode(data);
    } catch {
      return { ok: false, error: `${name} could not be read.` };
    }
    if (bytes.length > MAX_ATTACH_BYTES) {
      return { ok: false, error: `${name} is too large (max 4 MB).` };
    }
    total += bytes.length;
    if (total > MAX_ATTACH_TOTAL_BYTES) {
      return { ok: false, error: "Those files together are too large." };
    }

    const jpeg = type === "image/jpeg" || type === "image/jpg";
    const png = type === "image/png";
    const pdf = type === "application/pdf";
    const text = TEXT.has(type);

    if (jpeg && !looksLikeJpeg(bytes)) {
      return { ok: false, error: `${name} is not a JPEG.` };
    }
    if (png && !looksLikePng(bytes)) {
      return { ok: false, error: `${name} is not a PNG.` };
    }
    if (pdf) {
      if (!looksLikePdf(bytes)) {
        return { ok: false, error: `${name} is not a PDF.` };
      }
      pdfs += 1;
      if (pdfs > MAX_PDF_FILES) {
        return { ok: false, error: "One PDF per message." };
      }
    }

    if (!jpeg && !png && !pdf && !text) {
      return {
        ok: false,
        error: "Use a JPG, PNG, PDF, or a small text file.",
      };
    }

    files.push({ name, type: jpeg ? "image/jpeg" : type, data });
  }

  return { ok: true, files };
}

async function uploadXaiFile(name: string, type: string, bytes: Buffer) {
  const { apiUrl, apiKey } = grokAuth();
  const form = new FormData();
  form.append("purpose", "assistants");
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
  const checked = validateAskAttachments(attachments);
  if (!checked.ok) throw new Error(checked.error);

  const parts: GrokContentPart[] = [];
  let images = 0;

  for (const file of checked.files) {
    const type = (file.type || guessType(file.name)).toLowerCase();
    const bytes = decode(file.data);

    if (IMAGE.has(type)) {
      const mime = type === "image/jpg" ? "image/jpeg" : type;
      images += 1;
      parts.push({
        type: "input_image",
        image_url: `data:${mime};base64,${file.data}`,
        detail: images === 1 ? "high" : "low",
      });
      continue;
    }

    if (TEXT.has(type)) {
      parts.push({
        type: "input_text",
        text: `Attached file ${file.name}:\n${bytes
          .toString("utf8")
          .slice(0, MAX_TEXT_ATTACH_CHARS)}`,
      });
      continue;
    }

    if (type === "application/pdf") {
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
