import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { InviteForm } from "@/components/settings/InviteForm";
import { PartnerList } from "@/components/settings/PartnerList";
import { PendingInvites } from "@/components/settings/PendingInvites";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Invitations I sent
  const { data: sentInvites } = await supabase
    .from("partners")
    .select("*, invitee:profiles!partners_invitee_id_fkey(display_name)")
    .eq("inviter_id", user.id)
    .order("created_at", { ascending: false });

  // Invitations sent to me (by my email)
  const { data: receivedInvites } = await supabase
    .from("partners")
    .select("*, inviter:profiles!partners_inviter_id_fkey(display_name)")
    .eq("invitee_email", user.email?.toLowerCase())
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <Link
          href="/dashboard"
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          Back
        </Link>
      </div>

      {/* Pending invites received */}
      {receivedInvites && receivedInvites.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Pending Invitations
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Someone wants to share their baby profiles with you.
          </p>
          <PendingInvites invites={receivedInvites} />
        </div>
      )}

      {/* Partner management */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Partner Sharing
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Invite your partner so you both have access to the same babies,
          conversations, and memories.
        </p>

        <InviteForm className="mt-4" />

        {sentInvites && sentInvites.length > 0 && (
          <PartnerList partners={sentInvites} className="mt-6" />
        )}
      </div>
    </div>
  );
}
