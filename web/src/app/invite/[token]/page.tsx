import { InviteSetup } from "@/components/InviteSetup";
import { Glass } from "@/components/Glass";
import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
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
      <div className="login-stage">
        <Glass className="login-card">
          <p className="brand-mark">{APP_NAME}</p>
          <h1 className="login-title">Invite needed</h1>
          <p className="login-sub">{reason} Ask Camron for a new link.</p>
        </Glass>
      </div>
    );
  }

  return <InviteSetup token={token} />;
}
