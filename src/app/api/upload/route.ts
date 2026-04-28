import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import sharp from "sharp";

const MAX_DIMENSION = 1600; // Max width/height — good enough for context photos
const JPEG_QUALITY = 80;

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

  // Validate file size (10MB raw — we'll compress before storing)
  if (file.size > 10 * 1024 * 1024) {
    return Response.json(
      { error: "File too large. Maximum size is 10MB." },
      { status: 400 }
    );
  }

  try {
    // Resize and compress to JPEG
    const buffer = Buffer.from(await file.arrayBuffer());
    const compressed = await sharp(buffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();

    const filename = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

    const { data, error } = await supabase.storage
      .from("chat-images")
      .upload(filename, compressed, {
        contentType: "image/jpeg",
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
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
