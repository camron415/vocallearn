import Link from "next/link";
import { InviteSetup } from "@/components/InviteSetup";
import { AuthShell } from "@/components/AuthShell";
import { createClient } from "@/lib/supabase/server";

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.rpc("halo_peek_invite", { tok: token });
  const peek = (data ?? {}) as { ok?: boolean; reason?: string };

  if (!peek.ok) {
    const reason =
      peek.reason === "used"
        ? "This invite was already used. Each link creates exactly one account."
        : peek.reason === "expired"
          ? "This invite has expired."
          : "This invite link is not valid.";
    return (
      <AuthShell
        title="Invite needed"
        sub={`${reason} Ask Camron for a new link.`}
        footer={
          <Link href="/login" className="stone-btn login-submit">
            Sign in
          </Link>
        }
      />
    );
  }

  return <InviteSetup token={token} initialError={error ?? null} />;
}
