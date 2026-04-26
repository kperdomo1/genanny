"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { invitePartner } from "@/app/dashboard/settings/actions";

function InviteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
    >
      {pending ? "Sending..." : "Invite"}
    </button>
  );
}

export function InviteForm({ className }: { className?: string }) {
  const [state, formAction] = useActionState(
    async (_prev: { error: string | null }, formData: FormData): Promise<{ error: string | null }> => {
      const result = await invitePartner(formData);
      return result ?? { error: null };
    },
    { error: null as string | null }
  );

  return (
    <form action={formAction} className={className}>
      {state.error && (
        <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      <div className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="Partner's email"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <InviteButton />
      </div>
    </form>
  );
}
