"use client";

import { useFormStatus } from "react-dom";
import { removePartner } from "@/app/dashboard/settings/actions";

interface Partner {
  id: string;
  invitee_email: string;
  status: string;
  created_at: string;
  invitee?: { display_name: string | null } | null;
}

function RemoveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs text-red-600 hover:text-red-500 disabled:opacity-50"
    >
      {pending ? "Removing..." : "Remove"}
    </button>
  );
}

export function PartnerList({
  partners,
  className,
}: {
  partners: Partner[];
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="text-sm font-medium text-gray-700">Your invitations</h3>
      <div className="mt-2 space-y-2">
        {partners.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">
                {p.invitee?.display_name ?? p.invitee_email}
              </p>
              <p className="text-xs text-gray-400">
                {p.status === "accepted" ? (
                  <span className="text-green-600">Connected</span>
                ) : (
                  <span className="text-amber-600">Pending</span>
                )}
              </p>
            </div>
            <form action={removePartner}>
              <input type="hidden" name="partner_id" value={p.id} />
              <RemoveButton />
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
