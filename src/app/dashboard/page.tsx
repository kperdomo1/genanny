import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PendingInvites } from "@/components/settings/PendingInvites";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check for pending partner invitations
  const { data: pendingInvites } = await supabase
    .from("partners")
    .select("*, inviter:profiles!partners_inviter_id_fkey(display_name)")
    .eq("invitee_email", user!.email?.toLowerCase() ?? "")
    .eq("status", "pending");

  const { data: babies } = await supabase
    .from("babies")
    .select("*")
    .order("created_at", { ascending: true });

  // Show pending invites prominently if user has no babies yet
  // (likely a partner who just signed up)
  if ((!babies || babies.length === 0) && pendingInvites && pendingInvites.length > 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center">
            <div className="text-4xl">💌</div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              You&apos;ve been invited!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Accept the invitation to share access to your partner&apos;s babies,
              conversations, and memories.
            </p>
          </div>
          <PendingInvites invites={pendingInvites} />
        </div>
      </div>
    );
  }

  if (!babies || babies.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl">👶</div>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">
          Add your baby
        </h2>
        <p className="mt-2 text-sm text-gray-600 max-w-xs">
          Get started by adding your baby&apos;s profile. This helps Genanny
          give personalized advice.
        </p>
        <Link
          href="/dashboard/babies"
          className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          Add baby
        </Link>
      </div>
    );
  }

  const baby = babies[0];
  const dob = new Date(baby.date_of_birth);
  const now = new Date();
  const ageMonths =
    (now.getFullYear() - dob.getFullYear()) * 12 +
    (now.getMonth() - dob.getMonth());

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      {/* Show pending invites as a banner even if user already has babies */}
      {pendingInvites && pendingInvites.length > 0 && (
        <div className="w-full max-w-sm mb-6">
          <PendingInvites invites={pendingInvites} />
        </div>
      )}

      <h2 className="text-xl font-semibold text-gray-900">
        Hi! How can I help with {baby.name} today?
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        {baby.name} is {ageMonths} months old
      </p>
      <Link
        href={`/dashboard/chat?baby=${baby.id}`}
        className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
      >
        Start a conversation
      </Link>
    </div>
  );
}
