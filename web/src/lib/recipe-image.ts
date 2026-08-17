const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

function isRecipePhoto(file: File) {
  const type = file.type.toLowerCase();
  if (type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name);
}

async function bitmapFromFile(file: File) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through to Image */
    }
  }

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that photo. Try a JPEG or PNG."));
    };
    image.src = url;
  });
}

export async function compressRecipePhoto(file: File): Promise<Blob> {
  if (!isRecipePhoto(file)) {
    throw new Error("Use a JPEG, PNG, or similar photo.");
  }

  const source = await bitmapFromFile(file);
  const width = "width" in source ? source.width : 0;
  const height = "height" in source ? source.height : 0;
  if (!width || !height) {
    throw new Error("Could not read that photo. Try a JPEG or PNG.");
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare that photo.");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) {
    source.close();
  }

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
  });
  if (!blob) throw new Error("Could not save that photo.");
  return blob;
}
