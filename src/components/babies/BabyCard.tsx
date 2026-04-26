"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { Baby } from "@/lib/types";

export function BabyCard({ baby }: { baby: Baby }) {
  const dob = new Date(baby.date_of_birth);
  const now = new Date();
  const ageMonths =
    (now.getFullYear() - dob.getFullYear()) * 12 +
    (now.getMonth() - dob.getMonth());

  const genderEmoji =
    baby.gender === "male" ? "👦" : baby.gender === "female" ? "👧" : "👶";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{genderEmoji}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{baby.name}</h3>
            <p className="text-sm text-gray-500">
              {ageMonths} months old &middot; Born{" "}
              {dob.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <Link
          href={`/dashboard/babies/${baby.id}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Edit
        </Link>
      </div>
      {baby.notes && (
        <div className="mt-2 text-sm text-gray-600 prose-chat">
          <ReactMarkdown>{baby.notes}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
