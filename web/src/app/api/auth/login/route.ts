import { NextRequest, NextResponse } from "next/server";
import {
  authErrorMessage,
  emailError,
  normalizeEmail,
} from "@/lib/account";
import { createRouteClient } from "@/lib/supabase/route";
import { publicUrl } from "@/lib/public-origin";

export const dynamic = "force-dynamic";

function wantsJson(request: Request) {
  const accept = request.headers.get("accept") || "";
  const contentType = request.headers.get("content-type") || "";
  return (
    contentType.includes("application/json") ||
    accept.includes("application/json")
  );
}

async function readCredentials(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };
    return {
      email: body.email ?? "",
      password: body.password ?? "",
    };
  }
  const form = await request.formData();
  return {
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
  };
}

function loginFail(request: NextRequest, message: string, status = 400) {
  if (wantsJson(request)) {
    return NextResponse.json({ error: message }, { status });
  }
  const url = publicUrl(request, "/login");
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, 303);
}

/** Server sign-in — session cookies on redirect (Safari-safe). */
export async function POST(request: NextRequest) {
  const json = wantsJson(request);
  const { email: rawEmail, password } = await readCredentials(request);

  const nextEmail = emailError(rawEmail);
  if (nextEmail) return loginFail(request, nextEmail, 400);
  if (!password) return loginFail(request, "Enter your password.", 400);

  const askUrl = publicUrl(request, "/ask");
  const { supabase, response } = createRouteClient(request, () =>
    json
      ? NextResponse.json({ ok: true, next: "/ask" })
      : NextResponse.redirect(askUrl, 303)
  );

  const { error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(rawEmail),
    password,
  });
  if (error) {
    return loginFail(request, authErrorMessage(error.message), 401);
  }

  return response();
}
