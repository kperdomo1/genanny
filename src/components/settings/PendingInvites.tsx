"use client";

import { useFormStatus } from "react-dom";
import { acceptInvitation } from "@/app/dashboard/settings/actions";

interface Invite {
  id: string;
  inviter: { display_name: string | null } | null;
  created_at: string;
}

function AcceptButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
    >
      {pending ? "Accepting..." : "Accept"}
    </button>
  );
}

export function PendingInvites({ invites }: { invites: Invite[] }) {
  return (
    <div className="mt-3 space-y-2">
      {invites.map((inv) => (
        <div
          key={inv.id}
          className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3"
        >
          <div>
            <p className="text-sm font-medium text-gray-900">
              {inv.inviter?.display_name ?? "Someone"} invited you
            </p>
            <p className="text-xs text-gray-500">
              Share access to babies, conversations & memories
            </p>
          </div>
          <form action={acceptInvitation}>
            <input type="hidden" name="partner_id" value={inv.id} />
            <AcceptButton />
          </form>
        </div>
      ))}
    </div>
  );
}
