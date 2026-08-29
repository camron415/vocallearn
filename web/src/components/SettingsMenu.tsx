"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { ChoicePicks } from "@/components/ChoicePicks";
import { GlassButton } from "@/components/Glass";
import { LengthPicks } from "@/components/LengthPicks";
import { useMotionSettings } from "@/components/MotionProvider";
import { useOursWet, WaterPane } from "@/components/WaterSurface";
import { APP_NAME } from "@/lib/constants";
import { formatUsd, isHaloLane, laneLabel, type HaloLane } from "@/lib/limits";
import { createClient } from "@/lib/supabase/client";
import type { AnswerLength, HaloProfile } from "@/lib/types";

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
  const { intensity, setIntensity, theme, setTheme, autoSoft } =
    useMotionSettings();
  const wet = useOursWet();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(profile?.displayName ?? "");
  const [length, setLength] = useState<AnswerLength>(
    profile?.answerLength ?? "medium"
  );
  const [nameState, setNameState] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteLane, setInviteLane] = useState<HaloLane | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

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

  async function saveLength(next: AnswerLength) {
    setLength(next);
    if (demo || next === length) return;
    await patchProfile({ answerLength: next });
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

  const page = open ? (
    <div
      className="history-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="history-page settings-page">
        <div className="history-page-head">
          <h1 id="settings-title" className="history-page-title">
            Settings
          </h1>
          <GlassButton onClick={() => setOpen(false)}>Close</GlassButton>
        </div>

        <section className="settings-block">
          <label className="field-label" htmlFor="halo-name">
            What should {APP_NAME} call you?
          </label>
          <div className="settings-name">
            {!wet ? (
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
            ) : (
              <WaterPane variant="field" className="settings-name-pane" still>
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
              </WaterPane>
            )}
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
          <p className="field-label">Answer length</p>
          <LengthPicks value={length} onChange={(next) => void saveLength(next)} />
        </section>

        <section className="settings-block">
          <p className="field-label">Motion</p>
          <ChoicePicks
            label="Motion"
            value={intensity}
            onChange={setIntensity}
            options={
              [
                ["full", "Full"],
                ["reduced", "Soft"],
              ] as const
            }
          />
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
          {autoSoft ? (
            <p className="login-sub">
              This device started on Soft. You can still pick Full.
            </p>
          ) : null}
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

        {profile?.isAdmin && !demo ? (
          <section className="settings-block">
            <p className="field-label">Invite someone</p>
            <p className="login-sub">
              One-time link. They need a new email — not an existing VocalLearn
              login. Early access for her test account, Family for everyone
              else.
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

        {demo ? null : (
          <section className="settings-block">
            <GlassButton onClick={() => void signOut()}>Sign out</GlassButton>
          </section>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="history-wrap">
      <GlassButton title="Open settings" onClick={() => setOpen((v) => !v)}>
        Settings
      </GlassButton>
      {mounted && page ? createPortal(page, document.body) : null}
    </div>
  );
}
