"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChoicePicks } from "@/components/ChoicePicks";
import { GlassButton } from "@/components/Glass";
import { MenuSheet } from "@/components/MenuSheet";
import { SimpleSheet } from "@/components/SimpleSheet";
import { useMotionSettings } from "@/components/MotionProvider";
import { useCoarsePointer } from "@/lib/coarse-pointer";
import { APP_NAME } from "@/lib/constants";
import { formatUsd, isHaloLane, laneLabel, type HaloLane } from "@/lib/limits";
import { isLabBrowserHost } from "@/lib/lab-host";
import {
  clearKeepChips,
  dropKeepDue,
  resetRoundsToday,
} from "@/lib/keep-memory";
import { createClient } from "@/lib/supabase/client";
import type { HaloProfile } from "@/lib/types";

async function patchProfile(body: Record<string, unknown>) {
  await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

type Usage = {
  percent: number;
  showCost: boolean;
  lane?: HaloLane;
  spentWeek?: number;
  weekCap?: number;
  householdMonth?: number;
  householdCap?: number;
};

export function SettingsMenu({
  profile,
  demo = false,
}: {
  profile?: HaloProfile;
  demo?: boolean;
}) {
  const router = useRouter();
  const { theme, setTheme } = useMotionSettings();
  const [open, setOpen] = useState(false);
  const coarse = useCoarsePointer();
  const [name, setName] = useState(profile?.displayName ?? "");
  const [nameState, setNameState] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteLane, setInviteLane] = useState<HaloLane | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [qaNote, setQaNote] = useState<string | null>(null);
  const admin = Boolean(profile?.isAdmin) && !demo;
  const labQa = admin && isLabBrowserHost();

  useEffect(() => {
    if (!open || demo) return;
    let cancelled = false;
    void fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setUsage({
          percent: Number(data.percent) || 0,
          showCost: Boolean(data.showCost),
          lane: isHaloLane(data.lane) ? data.lane : undefined,
          spentWeek: Number(data.spentWeek) || 0,
          weekCap: Number(data.weekCap) || 0,
          householdMonth: Number(data.householdMonth) || 0,
          householdCap: Number(data.householdCap) || 0,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [open, demo]);

  async function saveName() {
    const next = name.trim();
    if (demo || !next) return;
    if (next === profile?.displayName) {
      setNameState("saved");
      window.setTimeout(() => setNameState("idle"), 1200);
      return;
    }
    setNameState("saving");
    await patchProfile({ displayName: next });
    setNameState("saved");
    window.setTimeout(() => setNameState("idle"), 1200);
    router.refresh();
  }

  async function makeInvite(lane: "family" | "tester") {
    setInviteError(null);
    setCopied(false);
    setInviteLane(lane);
    const res = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lane }),
    });
    const data = await res.json();
    if (!res.ok) {
      setInviteError(data.error || "Could not create invite");
      setInviteUrl(null);
      return;
    }
    setInviteUrl(data.url as string);
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  function flashQa(message: string) {
    setQaNote(message);
    window.setTimeout(() => setQaNote(null), 2400);
  }

  async function clearAllChats() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("ask_conversations")
      .select("id")
      .eq("user_id", user.id);
    const ids = (data ?? []).map((row) => row.id as string);
    if (!ids.length) {
      flashQa("No chats to clear.");
      return;
    }
    const res = await fetch("/api/chats", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) {
      flashQa("Could not clear chats.");
      return;
    }
    flashQa(`Cleared ${ids.length} chat${ids.length === 1 ? "" : "s"}.`);
    router.refresh();
  }

  const Sheet = coarse ? SimpleSheet : MenuSheet;

  return (
    <div className="history-wrap">
      <GlassButton title="Open settings" onClick={() => setOpen(true)}>
        <span className="topbar-action-label">Settings</span>
        <svg
          className="topbar-action-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.2 6.2l1.4 1.4M16.4 16.4l1.4 1.4M17.8 6.2l-1.4 1.4M7.6 16.4l-1.4 1.4" />
        </svg>
      </GlassButton>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Settings"
        titleId="settings-title"
        cardClassName="settings-page"
      >
        <section className="settings-block">
          <label className="field-label" htmlFor="halo-name">
            What should {APP_NAME} call you?
          </label>
          <div className="settings-name">
            <div className="settings-name-pane">
              <input
                id="halo-name"
                className="field"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameState("idle");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void saveName();
                  }
                }}
                maxLength={40}
              />
            </div>
            {demo ? null : (
              <GlassButton onClick={() => void saveName()}>
                {nameState === "saving"
                  ? "Saving…"
                  : nameState === "saved"
                    ? "Saved"
                    : "Save"}
              </GlassButton>
            )}
          </div>
        </section>

        <section className="settings-block">
          <p className="field-label">Appearance</p>
          <ChoicePicks
            label="Appearance"
            value={theme}
            onChange={setTheme}
            options={
              [
                ["light", "Light"],
                ["dark", "Dark"],
              ] as const
            }
          />
        </section>

        {demo ? null : (
          <section className="settings-block">
            <p className="field-label">Usage</p>
            <p className="login-sub">
              {usage
                ? usage.showCost
                  ? `${formatUsd(usage.spentWeek ?? 0)} of ${formatUsd(usage.weekCap ?? 0)} this week${
                      usage.householdCap
                        ? ` · household ${formatUsd(usage.householdMonth ?? 0)} of ${formatUsd(usage.householdCap)} this month`
                        : ""
                    }${usage.lane ? ` · ${laneLabel(usage.lane)}` : ""}`
                  : `${usage.percent}% of this week’s usage`
                : "Loading…"}
            </p>
          </section>
        )}

        {admin ? (
          <section className="settings-block">
            <p className="field-label">Invite someone</p>
            <p className="login-sub">
              One-time link. They need a new email — not an existing VocalLearn
              login. Early access for a test account, Family for everyone else.
            </p>
            <div className="settings-row">
              <GlassButton onClick={() => void makeInvite("family")}>
                Family invite
              </GlassButton>
              <GlassButton onClick={() => void makeInvite("tester")}>
                Early access invite
              </GlassButton>
              <GlassButton
                onClick={() => {
                  setOpen(false);
                  router.push("/admin");
                }}
              >
                Family activity
              </GlassButton>
            </div>
            {inviteError ? <p className="form-error">{inviteError}</p> : null}
            {inviteUrl ? (
              <div className="invite-copy">
                <code>
                  {inviteLane === "tester" ? "Early access · " : "Family · "}
                  {inviteUrl}
                </code>
                <GlassButton onClick={() => void copyInvite()}>
                  {copied ? "Copied" : "Copy"}
                </GlassButton>
              </div>
            ) : null}
          </section>
        ) : null}

        {labQa ? (
          <section className="settings-block">
            <p className="field-label">Lab QA</p>
            <p className="login-sub">
              Localhost / LAN only. See <code>web/HARVEST-OPS.md</code> for the
              full promote checklist.
            </p>
            <div className="settings-row">
              <GlassButton
                onClick={() => {
                  dropKeepDue();
                  flashQa("All Keep chips are due on Home.");
                }}
              >
                Force due now
              </GlassButton>
              <GlassButton
                onClick={() => {
                  resetRoundsToday();
                  flashQa("Day round cap reset.");
                }}
              >
                Reset rounds today
              </GlassButton>
            </div>
            <div className="settings-row">
              <GlassButton
                onClick={() => {
                  clearKeepChips();
                  flashQa("Keep cleared.");
                  router.refresh();
                }}
              >
                Clear Keep
              </GlassButton>
              <GlassButton onClick={() => void clearAllChats()}>
                Clear all chats
              </GlassButton>
            </div>
            {qaNote ? <p className="login-sub">{qaNote}</p> : null}
          </section>
        ) : null}

        {demo ? null : (
          <section className="settings-block settings-block--end">
            <GlassButton onClick={() => void signOut()}>Sign out</GlassButton>
          </section>
        )}
      </Sheet>
    </div>
  );
}
