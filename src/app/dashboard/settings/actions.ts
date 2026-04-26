"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function invitePartner(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const email = (formData.get("email") as string).trim().toLowerCase();

  if (email === user.email?.toLowerCase()) {
    return { error: "You can't invite yourself!" };
  }

  // Check if already invited
  const { data: existing } = await supabase
    .from("partners")
    .select("id, status")
    .eq("inviter_id", user.id)
    .eq("invitee_email", email)
    .maybeSingle();

  if (existing) {
    return {
      error:
        existing.status === "accepted"
          ? "This person is already your partner."
          : "An invitation has already been sent to this email.",
    };
  }

  // Check if the invitee already has an account
  // We look up by email in profiles via auth
  const { data: inviteeProfile } = await supabase
    .from("profiles")
    .select("id")
    .limit(1);

  // We can't query auth.users directly from client, so we'll resolve
  // the invitee_id when they accept. For now just store the email.
  const { error } = await supabase.from("partners").insert({
    inviter_id: user.id,
    invitee_email: email,
    status: "pending",
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard/settings");
}

export async function acceptInvitation(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const partnerId = formData.get("partner_id") as string;

  await supabase
    .from("partners")
    .update({
      invitee_id: user.id,
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", partnerId)
    .eq("invitee_email", user.email?.toLowerCase());

  redirect("/dashboard/settings");
}

export async function removePartner(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const partnerId = formData.get("partner_id") as string;

  await supabase
    .from("partners")
    .delete()
    .eq("id", partnerId)
    .eq("inviter_id", user.id);

  redirect("/dashboard/settings");
}
