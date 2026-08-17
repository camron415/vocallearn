"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Glass } from "@/components/Glass";
import { APP_NAME } from "@/lib/constants";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace("/ask");
    router.refresh();
  }

  return (
    <Glass className="login-card">
      <p className="brand-mark">{APP_NAME}</p>
      <h1 className="login-title">Welcome back</h1>
      <p className="login-sub">
        Invite-only. If you don’t have an account yet, ask Camron for a
        private invite link.
      </p>

      <form className="login-form" onSubmit={onSubmit}>
        <label className="field-label">
          Email
          <input
            className="field"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="field-label">
          Password
          <input
            className="field"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </Glass>
  );
}
