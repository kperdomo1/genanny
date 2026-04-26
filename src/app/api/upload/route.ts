import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ];
  if (!allowedTypes.includes(file.type)) {
    return Response.json(
      { error: "Invalid file type. Supported: JPEG, PNG, WebP, HEIC" },
      { status: 400 }
    );
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return Response.json(
      { error: "File too large. Maximum size is 5MB." },
      { status: 400 }
    );
  }

  // Generate a unique filename under the user's folder
  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { data, error } = await supabase.storage
    .from("chat-images")
    .upload(filename, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return Response.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("chat-images").getPublicUrl(data.path);

  return Response.json({ url: publicUrl, path: data.path });
}
