import { NextRequest, NextResponse } from "next/server";
import {
  authErrorMessage,
  emailError,
  nameError,
  normalizeEmail,
  passwordError,
} from "@/lib/account";
import { createRouteClient } from "@/lib/supabase/route";
import { publicOrigin, publicUrl } from "@/lib/public-origin";

export const dynamic = "force-dynamic";

function wantsJson(request: Request) {
  const accept = request.headers.get("accept") || "";
  const contentType = request.headers.get("content-type") || "";
  return contentType.includes("application/json") || accept.includes("application/json");
}

function fail(
  request: Request,
  error: string,
  status = 400,
  token?: string
) {
  if (wantsJson(request)) {
    return NextResponse.json({ error }, { status });
  }
  const path = token ? `/invite/${encodeURIComponent(token)}` : "/login";
  const url = publicUrl(request, path);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}

async function readBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      token?: string;
      name?: string;
      email?: string;
      password?: string;
    };
    return {
      token: (body.token ?? "").trim(),
      name: body.name ?? "",
      email: body.email ?? "",
      password: body.password ?? "",
    };
  }
  const form = await request.formData();
  return {
    token: String(form.get("token") ?? "").trim(),
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
  };
}

export async function POST(request: NextRequest) {
  let fields: {
    token: string;
    name: string;
    email: string;
    password: string;
  };
  try {
    fields = await readBody(request);
  } catch {
    return fail(request, "Could not read that form. Try again.");
  }

  const token = fields.token;
  if (!token) return fail(request, "This invite link is not valid.");

  const nextName = nameError(fields.name);
  const nextEmail = emailError(fields.email);
  const nextPassword = passwordError(fields.password);
  const first = nextName || nextEmail || nextPassword;
  if (first) return fail(request, first, 400, token);

  const email = normalizeEmail(fields.email);
  const origin = publicOrigin(request);
  const askUrl = publicUrl(request, "/ask");
  const { supabase, response } = createRouteClient(request, () =>
    wantsJson(request)
      ? NextResponse.json({ ok: true, next: "/ask" })
      : NextResponse.redirect(askUrl, 303)
  );

  const reserved = await supabase.rpc("halo_reserve_invite", { tok: token });
  if (reserved.error) {
    const peek = await supabase.rpc("halo_peek_invite", { tok: token });
    const ok = Boolean((peek.data as { ok?: boolean } | null)?.ok);
    if (!ok) return fail(request, "This invite link is not valid.", 400, token);
  } else {
    const result = (reserved.data ?? {}) as { ok?: boolean; reason?: string };
    if (!result.ok) {
      const message =
        result.reason === "used"
          ? "This invite was already used. Ask Camron for a new link."
          : result.reason === "busy"
            ? "Someone is already using this invite. Wait a minute and try again."
            : result.reason === "expired"
              ? "This invite has expired. Ask Camron for a new link."
              : "This invite link is not valid.";
      return fail(request, message, 409, token);
    }
  }

  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password: fields.password,
    options: {
      emailRedirectTo: `${origin.replace(/\/$/, "")}/ask`,
      data: {
        display_name: fields.name.trim(),
        invite_token: token,
        app: "halo",
      },
    },
  });

  if (signUpError) {
    return fail(request, authErrorMessage(signUpError.message), 400, token);
  }
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    return fail(
      request,
      "That email already has an account. Sign in from the login page.",
      409,
      token
    );
  }
  if (!data.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: fields.password,
    });
    if (signInError) {
      return fail(
        request,
        "Account started, but Cove couldn’t sign you in. Try the login page with this email.",
        400,
        token
      );
    }
  }

  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser();
  const userId = sessionUser?.id ?? data.user?.id;
  if (userId) {
    await supabase
      .from("profiles")
      .update({
        display_name: fields.name.trim(),
        answer_length: "medium",
        halo_onboarded_at: new Date().toISOString(),
      })
      .eq("id", userId);
  }

  return response();
}
