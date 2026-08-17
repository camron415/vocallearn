"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Glass } from "@/components/Glass";
import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

export function InviteSetup({ token }: { token: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const hold = await fetch("/api/invite/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const held = await hold.json();
    if (!hold.ok) {
      setLoading(false);
      setError(held.error || "This invite is no longer available.");
      return;
    }

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: name.trim(),
          invite_token: token,
          app: "halo",
        },
      },
    });
    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(
        "Account created. If you see a confirm-email screen, ask Camron to turn that off, then sign in from the login page."
      );
      return;
    }
    router.replace("/ask");
    router.refresh();
  }

  return (
    <div className="login-stage">
      <Glass className="login-card">
        <p className="brand-mark">{APP_NAME}</p>
        <h1 className="login-title">Join {APP_NAME}</h1>
        <p className="login-sub">
          This invite is just for you, and it only works once. After you
          create the account, the link cannot be reused.
        </p>
        <form className="login-form" onSubmit={onSubmit}>
          <label className="field-label">
            Name
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={40}
            />
          </label>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
      </Glass>
    </div>
  );
}
