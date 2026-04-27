"use client";

import { useActionState } from "react";
import { addBaby, updateBaby } from "@/app/dashboard/babies/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { Baby } from "@/lib/types";

export function BabyForm({
  baby,
  className,
}: {
  baby?: Baby;
  className?: string;
}) {
  const action = baby ? updateBaby : addBaby;

  const [state, formAction] = useActionState(
    async (_prev: { error: string | null }, formData: FormData): Promise<{ error: string | null }> => {
      const result = await action(formData);
      return result ?? { error: null };
    },
    { error: null as string | null }
  );

  return (
    <form action={formAction} className={className}>
      {baby && <input type="hidden" name="id" value={baby.id} />}

      {state.error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
          <input id="name" name="name" type="text" required defaultValue={baby?.name}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Baby's name" />
        </div>

        <div>
          <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">Date of birth</label>
          <input id="date_of_birth" name="date_of_birth" type="date" required defaultValue={baby?.date_of_birth}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>

        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
          <select id="gender" name="gender" defaultValue={baby?.gender ?? ""}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (optional)</label>
          <textarea id="notes" name="notes" rows={3} defaultValue={baby?.notes ?? ""}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Anything you'd like Genanny to know..." />
        </div>

        <SubmitButton
          pendingText={baby ? "Saving..." : "Adding..."}
          className="w-full"
        >
          {baby ? "Save changes" : "Add baby"}
        </SubmitButton>
      </div>
    </form>
  );
}
