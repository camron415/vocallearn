import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { ids?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ids = Array.isArray(body.ids)
    ? body.ids.filter(
        (id): id is string => typeof id === "string" && id.length > 0 && id.length < 80
      )
    : [];
  if (!ids.length || ids.length > 80) {
    return NextResponse.json({ error: "Pick chats to remove." }, { status: 400 });
  }

  const { error } = await supabase
    .from("ask_conversations")
    .delete()
    .in("id", ids)
    .eq("user_id", user.id);
  if (error) {
    return NextResponse.json({ error: "Could not remove those chats." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
