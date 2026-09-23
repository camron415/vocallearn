"use client";

import { FormEvent, useEffect, useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { emailError } from "@/lib/account";

const SOCIAL_WAIT =
  "Apple and Google need the paid Apple account. Email works now.";

function AppleMark() {
  return (
    <svg className="login-oauth-icon" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M16.37 12.64c-.03-2.23 1.82-3.3 1.9-3.35-1.04-1.52-2.65-1.73-3.22-1.75-1.37-.14-2.68.8-3.38.8-.7 0-1.77-.78-2.92-.76-1.5.02-2.89.87-3.66 2.22-1.56 2.71-.4 6.72 1.12 8.92.75 1.08 1.64 2.29 2.81 2.25 1.13-.05 1.56-.73 2.92-.73 1.36 0 1.75.73 2.94.71 1.22-.02 1.98-1.1 2.72-2.18.86-1.25 1.21-2.47 1.23-2.53-.03-.01-2.36-.9-2.4-3.6ZM14.7 6.3c.62-.75 1.04-1.79.93-2.83-.9.04-1.98.6-2.62 1.35-.58.66-1.08 1.72-.95 2.73 1 .08 2.03-.51 2.64-1.25Z"
      />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg className="login-oauth-icon" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.47 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.55.37-2.27V6.64H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.36l4-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.14 15.23 0 12 0 7.31 0 3.26 2.69 1.27 6.64l4 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

export function LoginForm({
  demo = false,
  initialError = null,
}: {
  demo?: boolean;
  initialError?: string | null;
}) {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [invite, setInvite] = useState("");
  const [joinOpen, setJoinOpen] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

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
  }

  function onJoin(e: FormEvent) {
    e.preventDefault();
    const token = invite.trim();
    if (!token) {
      setError("Paste the invite code from your link.");
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(token)) {
      setError("That invite code doesn’t look right.");
      return;
    }
    if (demo) {
      setError("Preview only — no account is created.");
      return;
    }
    window.location.assign(`/invite/${encodeURIComponent(token)}`);
  }

  function onSocial() {
    setNotice(SOCIAL_WAIT);
    setError(null);
  }

  if (!ready) return <div className="login-stage" />;

  return (
    <AuthShell
      title="Welcome back"
      sub="Invite-only. Sign in, or create an account with a private invite."
      footer={
        joinOpen ? null : (
          <button
            type="button"
            className="login-text-btn"
            onClick={() => {
              setJoinOpen(true);
              setError(null);
            }}
          >
            Create account
          </button>
        )
      }
    >
      <div className="login-oauth">
        <button type="button" className="login-oauth-btn login-apple" onClick={onSocial}>
          <AppleMark />
          Sign in with Apple
        </button>
        <button type="button" className="login-oauth-btn login-google" onClick={onSocial}>
          <GoogleMark />
          Sign in with Google
        </button>
      </div>
      {notice ? <p className="login-hint">{notice}</p> : null}
      <p className="login-or">or</p>
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
        {error && !joinOpen ? <p className="form-error">{error}</p> : null}
        <button type="submit" disabled={loading} className="stone-btn login-submit">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      {joinOpen ? (
        <form className="login-form login-join" onSubmit={onJoin}>
          <label className="field-label" htmlFor="login-invite">
            Invite code
          </label>
          <div className="settings-name-pane">
            <input
              id="login-invite"
              className="field"
              name="invite"
              autoComplete="off"
              placeholder="From your invite link"
              value={invite}
              onChange={(e) => setInvite(e.target.value)}
            />
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="stone-btn login-submit">
            Continue
          </button>
        </form>
      ) : null}
    </AuthShell>
  );
}
