import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { BabyForm } from "@/components/babies/BabyForm";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { deleteBaby } from "../actions";

export default async function EditBabyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: baby } = await supabase
    .from("babies")
    .select("*")
    .eq("id", id)
    .single();

  if (!baby) notFound();

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Edit {baby.name}</h1>
        <Link
          href="/dashboard/babies"
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          Back
        </Link>
      </div>

      <BabyForm baby={baby} className="mt-6" />

      <form action={deleteBaby} className="mt-8 border-t border-gray-200 pt-6">
        <input type="hidden" name="id" value={baby.id} />
        <SubmitButton pendingText="Deleting..." variant="danger" className="w-full">
          Delete {baby.name}&apos;s profile
        </SubmitButton>
      </form>
    </div>
  );
}
