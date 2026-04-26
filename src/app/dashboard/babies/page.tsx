import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BabyCard } from "@/components/babies/BabyCard";
import { BabyForm } from "@/components/babies/BabyForm";

export default async function BabiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: babies } = await supabase
    .from("babies")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Your babies</h1>
        <Link
          href="/dashboard"
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          Back
        </Link>
      </div>

      {babies && babies.length > 0 && (
        <div className="mt-6 space-y-4">
          {babies.map((baby) => (
            <BabyCard key={baby.id} baby={baby} />
          ))}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Add a baby</h2>
        <BabyForm className="mt-4" />
      </div>
    </div>
  );
}
