"use client";

import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { emailError } from "@/lib/account";

export function LoginForm({
  demo = false,
  initialError = null,
}: {
  demo?: boolean;
  initialError?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    const nextEmail = emailError(email);
    if (nextEmail) {
      e.preventDefault();
      setError(nextEmail);
      return;
    }
    if (!password) {
      e.preventDefault();
      setError("Enter your password.");
      return;
    }
    if (demo) {
      e.preventDefault();
      setError("Preview only — no sign-in.");
      return;
    }
    setLoading(true);
    setError(null);
    // Native POST → /api/auth/login sets cookies on redirect (Safari LAN).
  }

  return (
    <AuthShell
      title="Welcome back"
      sub="Invite-only. If you don’t have an account yet, ask Camron for a private invite link."
    >
      <form
        className="login-form"
        method="POST"
        action="/api/auth/login"
        noValidate
        onSubmit={onSubmit}
      >
        <label className="field-label" htmlFor="login-email">
          Email
        </label>
        <div className="settings-name-pane">
          <input
            id="login-email"
            name="email"
            className="field"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <label className="field-label" htmlFor="login-password">
          Password
        </label>
        <div className="settings-name-pane">
          <input
            id="login-password"
            name="password"
            className="field"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" disabled={loading} className="stone-btn login-submit">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
