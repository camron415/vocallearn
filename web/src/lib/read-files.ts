import type { ChatAttachment } from "@/lib/types";
import {
  MAX_ATTACH_BYTES,
  MAX_ATTACH_FILES,
  isAllowedFile,
  isImageFile,
} from "@/lib/files";

const JPEG_MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.readAsDataURL(blob);
  });
}

/** Safari can decode HEIC in bitmap; xAI only accepts jpeg/png. */
async function imageToJpeg(
  file: File
): Promise<{ blob: Blob; name: string } | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, JPEG_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return null;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob) return null;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return { blob, name };
  } catch {
    return null;
  }
}

export async function readAttachments(files: File[]): Promise<ChatAttachment[]> {
  const picked = files.slice(0, MAX_ATTACH_FILES);
  const out: ChatAttachment[] = [];
  for (const file of picked) {
    if (!isAllowedFile(file) && !isImageFile(file)) {
      throw new Error(`${file.name} isn’t a supported file type`);
    }

    let blob: Blob = file;
    let name = file.name;
    let type = file.type || "application/octet-stream";

    if (isImageFile(file)) {
      const jpeg = await imageToJpeg(file);
      if (!jpeg) {
        throw new Error(
          `Couldn’t read ${file.name}. Try a JPG or PNG, or a screenshot.`
        );
      }
      blob = jpeg.blob;
      name = jpeg.name;
      type = "image/jpeg";
    }

    if (blob.size > MAX_ATTACH_BYTES) {
      throw new Error(`${name} is over 4 MB`);
    }

    out.push({
      name,
      type,
      data: await blobToBase64(blob),
    });
  }
  return out;
}
