"use client";

import { createClient } from "@/lib/supabase/client";
import { isNativeApp } from "@/lib/native-shell";

/** Public OAuth client ids. Secrets stay in Supabase / .secrets. */
const GOOGLE_WEB_CLIENT_ID =
  "510970032625-3fg08pph71hmdtom2occbfufqocndlim.apps.googleusercontent.com";
const GOOGLE_IOS_CLIENT_ID =
  "510970032625-6qh008u10nh94d2e648acq7cmq2r5on5.apps.googleusercontent.com";
const APPLE_CLIENT_ID = "com.camrontrost.halo";

const NOT_INVITED =
  "This Apple or Google account isn’t on Halo yet. Sign in with the email on your invite, or ask Camron for one.";

export type SocialProvider = "apple" | "google";

function randomNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

function canceled(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /cancel/i.test(message);
}

export async function signInWithSocial(provider: SocialProvider) {
  if (!isNativeApp()) {
    throw new Error("Apple and Google sign-in are in the Halo app. Email works here.");
  }

  const { SocialLogin } = await import("@capgo/capacitor-social-login");
  await SocialLogin.initialize({
    apple: { clientId: APPLE_CLIENT_ID },
    google: {
      iOSClientId: GOOGLE_IOS_CLIENT_ID,
      iOSServerClientId: GOOGLE_WEB_CLIENT_ID,
      webClientId: GOOGLE_WEB_CLIENT_ID,
      mode: "online",
    },
  });

  const rawNonce = randomNonce();
  const hashedNonce = await sha256Hex(rawNonce);
  const login =
    provider === "apple"
      ? await SocialLogin.login({
          provider: "apple",
          options: { scopes: ["email", "name"], nonce: hashedNonce },
        })
      : await SocialLogin.login({
          provider: "google",
          options: { scopes: ["email", "profile"], nonce: rawNonce },
        });

  const result = login.result as { idToken?: string | null };
  const idToken = result.idToken;
  if (!idToken) throw new Error("Sign-in didn’t return a token. Try again.");

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider,
    token: idToken,
    nonce: rawNonce,
  });
  if (error) throw new Error(error.message);
  const userId = data.user?.id ?? data.session?.user.id;
  if (!userId) throw new Error("Sign-in didn’t start a session.");

  const member = await supabase
    .from("halo_members")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (member.error) throw new Error(member.error.message);
  if (!member.data) {
    await supabase.auth.signOut();
    throw new Error(NOT_INVITED);
  }

  window.location.assign("/ask");
}

export function socialErrorMessage(error: unknown) {
  if (canceled(error)) return null;
  return error instanceof Error ? error.message : "Sign-in didn’t finish.";
}
