import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: recipe } = await supabase
    .from("halo_recipes")
    .select("id, photo_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  const photoPaths = new Set<string>();
  if (recipe.photo_path) photoPaths.add(recipe.photo_path);
  photoPaths.add(`${user.id}/${id}.jpg`);
  photoPaths.add(`${user.id}/${id}.jpeg`);
  photoPaths.add(`${user.id}/${id}.png`);
  photoPaths.add(`${user.id}/${id}.webp`);
  photoPaths.add(`${user.id}/${id}.gif`);
  await supabase.storage.from("halo-recipe-photos").remove([...photoPaths]);

  const { error } = await supabase
    .from("halo_recipes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    return NextResponse.json({ error: "Could not remove that recipe." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
