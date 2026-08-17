import type { ChatAttachment } from "@/lib/types";
import { MAX_ATTACH_BYTES, MAX_ATTACH_FILES, isAllowedFile } from "@/lib/files";

export async function readAttachments(files: File[]): Promise<ChatAttachment[]> {
  const picked = files.slice(0, MAX_ATTACH_FILES);
  const out: ChatAttachment[] = [];
  for (const file of picked) {
    if (!isAllowedFile(file)) {
      throw new Error(`${file.name} isn’t a supported file type`);
    }
    if (file.size > MAX_ATTACH_BYTES) {
      throw new Error(`${file.name} is over 4 MB`);
    }
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
      reader.readAsDataURL(file);
    });
    out.push({
      name: file.name,
      type: file.type || "application/octet-stream",
      data,
    });
  }
  return out;
}
