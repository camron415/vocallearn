import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const NO_STORE = "no-store, no-cache, must-revalidate, max-age=0";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/_next/static")) {
    const res = NextResponse.next();
    if (process.env.NODE_ENV === "development") {
      res.headers.set("Cache-Control", NO_STORE);
      res.headers.set("Pragma", "no-cache");
      res.headers.set("Expires", "0");
    }
    return res;
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
