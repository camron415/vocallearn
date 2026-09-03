import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function previewSkinFromRequest(request: NextRequest): "paper" | "ours" | null {
  const path = request.nextUrl.pathname;
  if (path === "/preview" || path.startsWith("/preview/")) {
    const look = request.nextUrl.searchParams.get("look");
    if (look === "paper" || look === "ours") return look;
    const cookie = request.cookies.get("halo-preview-skin")?.value;
    if (cookie === "paper" || cookie === "ours") return cookie;
    return "paper";
  }
  return "paper";
}

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);
  const previewSkin = previewSkinFromRequest(request);
  if (previewSkin) requestHeaders.set("x-halo-home-skin", previewSkin);
  const themeQ = request.nextUrl.searchParams.get("theme");
  const themeCookie = request.cookies.get("halo-theme")?.value;
  const theme =
    themeQ === "dark" || themeQ === "light"
      ? themeQ
      : themeCookie === "dark" || themeCookie === "light"
        ? themeCookie
        : null;
  if (theme) requestHeaders.set("x-halo-theme", theme);
  const forwarded = { headers: requestHeaders };

  if (/^\/ask\/[1-6]$/.test(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/preview";
    url.search = "";
    const skin = request.cookies.get("halo-preview-skin")?.value;
    if (skin === "paper" || skin === "ours") url.searchParams.set("look", skin);
    return NextResponse.redirect(url);
  }

  const labFast =
    path === "/preview" ||
    path.startsWith("/preview/") ||
    path.startsWith("/_next") ||
    path === "/favicon.ico" ||
    path.startsWith("/api/dev/capture");

  if (labFast) {
    const res = NextResponse.next({ request: forwarded });
    res.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0"
    );
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    return res;
  }

  let supabaseResponse = NextResponse.next({ request: forwarded });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request: forwarded });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = path === "/login";
  const isPublic =
    isAuthRoute ||
    path.startsWith("/_next") ||
    path === "/favicon.ico" ||
    path === "/preview" ||
    path.startsWith("/preview/") ||
    path === "/demo" ||
    path.startsWith("/invite/") ||
    path.startsWith("/api/invite/reserve") ||
    path.startsWith("/api/invite/join") ||
    path.startsWith("/api/dev/capture") ||
    path.startsWith("/api/dev/ping") ||
    path.startsWith("/api/auth/login");

  if (!user && !isPublic && path !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (isAuthRoute || path.startsWith("/invite/"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/ask";
    return NextResponse.redirect(url);
  }

  if (
    process.env.NODE_ENV === "development" ||
    path === "/preview" ||
    path.startsWith("/preview/")
  ) {
    supabaseResponse.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0"
    );
    supabaseResponse.headers.set("Pragma", "no-cache");
    supabaseResponse.headers.set("Expires", "0");
  }

  return supabaseResponse;
}
