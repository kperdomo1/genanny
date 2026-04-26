"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Baby } from "@/lib/types";

export function BabySelector({ babies }: { babies: Baby[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedBabyId = searchParams.get("baby") ?? babies[0]?.id;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("baby", e.target.value);
    router.push(`?${params.toString()}`);
  }

  if (babies.length === 0) return null;

  if (babies.length === 1) {
    return (
      <span className="text-sm font-medium text-gray-700">
        {babies[0].name}
      </span>
    );
  }

  return (
    <select
      value={selectedBabyId}
      onChange={handleChange}
      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
    >
      {babies.map((baby) => (
        <option key={baby.id} value={baby.id}>
          {baby.name}
        </option>
      ))}
    </select>
  );
}
