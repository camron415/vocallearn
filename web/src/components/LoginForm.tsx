"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { GlassButton } from "@/components/Glass";
import { WaterPane } from "@/components/WaterSurface";
import {
  authErrorMessage,
  emailError,
  normalizeEmail,
} from "@/lib/account";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ demo = false }: { demo?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nextEmail = emailError(email);
    if (nextEmail) {
      setError(nextEmail);
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }

    if (demo) {
      setError("Preview only — no sign-in.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      });
      if (signInError) {
        setError(authErrorMessage(signInError.message));
        return;
      }
      router.replace("/ask");
      router.refresh();
    } catch {
      setError("Could not sign in. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      sub="Invite-only. If you don’t have an account yet, ask Camron for a private invite link."
    >
      <form className="login-form" noValidate onSubmit={(e) => void onSubmit(e)}>
        <label className="field-label" htmlFor="login-email">
          Email
        </label>
        <WaterPane variant="field" className="settings-name-pane" still>
          <input
            id="login-email"
            className="field"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </WaterPane>
        <label className="field-label" htmlFor="login-password">
          Password
        </label>
        <WaterPane variant="field" className="settings-name-pane" still>
          <input
            id="login-password"
            className="field"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </WaterPane>
        {error ? <p className="form-error">{error}</p> : null}
        <GlassButton type="submit" disabled={loading} className="login-submit">
          {loading ? "Signing in…" : "Sign in"}
        </GlassButton>
      </form>
    </AuthShell>
  );
}
