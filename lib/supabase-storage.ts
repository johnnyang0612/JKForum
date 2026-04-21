import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const UPLOAD_BUCKET = "jkforum-uploads";

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase config. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
}

export async function uploadToSupabase(
  file: File,
  opts: { kind: string; userId: string }
): Promise<UploadResult> {
  const supabase = getSupabaseAdmin();
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const path = `${opts.kind}/${opts.userId}/${filename}`;

  const arrayBuf = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(UPLOAD_BUCKET)
    .upload(path, arrayBuf, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data: pub } = supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(path);

  return {
    url: pub.publicUrl,
    path,
    size: file.size,
    type: file.type,
  };
}
