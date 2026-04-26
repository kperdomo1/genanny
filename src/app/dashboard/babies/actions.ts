"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function addBaby(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const name = formData.get("name") as string;
  const dateOfBirth = formData.get("date_of_birth") as string;
  const gender = (formData.get("gender") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  const { error } = await supabase.from("babies").insert({
    user_id: user.id,
    name,
    date_of_birth: dateOfBirth,
    gender,
    notes,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard/babies");
}

export async function updateBaby(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const dateOfBirth = formData.get("date_of_birth") as string;
  const gender = (formData.get("gender") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  const { error } = await supabase
    .from("babies")
    .update({
      name,
      date_of_birth: dateOfBirth,
      gender,
      notes,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard/babies");
}

export async function deleteBaby(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const id = formData.get("id") as string;

  await supabase
    .from("babies")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  redirect("/dashboard/babies");
}
