import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

/** Supabase auth in route handlers — cookies must land on the Response object. */
export function createRouteClient(
  request: NextRequest,
  buildResponse: () => NextResponse
) {
  let response = buildResponse();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = buildResponse();
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
          if (headers) {
            for (const [key, value] of Object.entries(headers)) {
              response.headers.set(key, value);
            }
          }
        },
      },
    }
  );

  return {
    supabase,
    response: () => response,
  };
}
