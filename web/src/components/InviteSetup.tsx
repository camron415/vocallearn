"use client";

import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { GlassButton } from "@/components/Glass";
import { WaterPane } from "@/components/WaterSurface";
import {
  authErrorMessage,
  emailError,
  MIN_PASSWORD,
  nameError,
  passwordError,
} from "@/lib/account";
import { APP_NAME } from "@/lib/constants";

export function InviteSetup({
  token,
  initialError,
  demo = false,
}: {
  token: string;
  initialError?: string | null;
  demo?: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (demo) {
      setError("Preview only — no account is created.");
      return;
    }
    const nextName = nameError(name);
    const nextEmail = emailError(email);
    const nextPassword = passwordError(password);
    const first = nextName || nextEmail || nextPassword;
    if (first) {
      setError(first);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/invite/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ token, name, email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        next?: string;
      };
      if (!res.ok) {
        setError(data.error || authErrorMessage("try again"));
        return;
      }
      window.location.assign(data.next || "/ask");
    } catch {
      setError("Could not finish that. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={`Join ${APP_NAME}`}
      sub="This invite is just for you, and it only works once. After you create the account, the link cannot be reused."
    >
      <form
        className="login-form"
        method="post"
        action="/api/invite/join"
        noValidate
        onSubmit={(e) => void onSubmit(e)}
      >
        <input type="hidden" name="token" value={token} />
        <label className="field-label" htmlFor="join-name">
          Name
        </label>
        <WaterPane variant="field" className="settings-name-pane" still>
          <input
            id="join-name"
            className="field"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            required
          />
        </WaterPane>
        <label className="field-label" htmlFor="join-email">
          Email
        </label>
        <WaterPane variant="field" className="settings-name-pane" still>
          <input
            id="join-email"
            className="field"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </WaterPane>
        <label className="field-label" htmlFor="join-password">
          Password
        </label>
        <WaterPane variant="field" className="settings-name-pane" still>
          <input
            id="join-password"
            className="field"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={MIN_PASSWORD}
            required
          />
        </WaterPane>
        <p className="login-hint">
          At least {MIN_PASSWORD} characters, with a letter and a number. Apple’s
          suggested password is fine.
        </p>
        {error ? <p className="form-error">{error}</p> : null}
        <GlassButton type="submit" disabled={loading} className="login-submit">
          {loading ? "Creating…" : "Create account"}
        </GlassButton>
      </form>
    </AuthShell>
  );
}
