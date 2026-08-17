import type { ChatAttachment } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

function extFor(type: string) {
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("gif")) return "gif";
  return "jpg";
}

export async function saveRecipePhoto(
  userId: string,
  recipeId: string,
  file: ChatAttachment
) {
  const supabase = await createClient();
  const ext = extFor(file.type);
  const path = `${userId}/${recipeId}.${ext}`;
  const bytes = Buffer.from(file.data, "base64");

  const contentType = file.type.includes("png")
    ? "image/png"
    : file.type.includes("webp")
      ? "image/webp"
      : file.type.includes("gif")
        ? "image/gif"
        : "image/jpeg";

  const { error } = await supabase.storage
    .from("halo-recipe-photos")
    .upload(path, bytes, {
      contentType,
      upsert: true,
    });
  if (error) return null;

  await supabase
    .from("halo_recipes")
    .update({ photo_path: path })
    .eq("id", recipeId)
    .eq("user_id", userId);

  return path;
}
