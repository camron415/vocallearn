import { NextResponse } from "next/server";
import { saveRecipePhoto } from "@/lib/recipe-photo";
import { createClient } from "@/lib/supabase/server";
import type { ChatAttachment } from "@/lib/types";

export async function POST(
  request: Request,
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
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  let body: { file?: ChatAttachment; path?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.path === "string" && body.path) {
    const expected = `${user.id}/${id}.`;
    if (!body.path.startsWith(expected) || body.path.includes("..")) {
      return NextResponse.json({ error: "Photo required" }, { status: 400 });
    }
    const { error } = await supabase
      .from("halo_recipes")
      .update({ photo_path: body.path })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) {
      return NextResponse.json(
        { error: "Could not save that photo." },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, path: body.path });
  }

  if (!body.file?.data) {
    return NextResponse.json({ error: "Photo required" }, { status: 400 });
  }

  const path = await saveRecipePhoto(user.id, id, body.file);
  if (!path) {
    return NextResponse.json(
      { error: "Could not save that photo." },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, path });
}
