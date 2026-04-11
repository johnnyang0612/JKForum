import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";
import { SITE_CONFIG } from "@/lib/constants/config";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ success: false, error: "請選擇檔案" }, { status: 400 });
  }

  // Validate file type
  if (!SITE_CONFIG.allowedImageTypes.includes(file.type)) {
    return NextResponse.json(
      { success: false, error: "不支援的檔案格式，僅支援 JPEG、PNG、WebP、GIF" },
      { status: 400 }
    );
  }

  // Validate file size
  if (file.size > SITE_CONFIG.maxUploadSize) {
    return NextResponse.json(
      { success: false, error: `檔案大小不能超過 ${SITE_CONFIG.maxUploadSize / 1024 / 1024}MB` },
      { status: 400 }
    );
  }

  try {
    const blob = await put(`uploads/${session.user.id}/${Date.now()}-${file.name}`, file, {
      access: "public",
    });

    return NextResponse.json({
      success: true,
      data: { url: blob.url, fileName: file.name, fileSize: file.size, mimeType: file.type },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, error: "上傳失敗" }, { status: 500 });
  }
}
