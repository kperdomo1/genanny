import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: babies } = await supabase
    .from("babies")
    .select("*")
    .order("created_at", { ascending: true });

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
