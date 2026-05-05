import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadToSupabase } from "@/lib/supabase-storage";

export const dynamic = "force-dynamic";

const MAX_CHAT_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * POST /api/chat/[slug]/upload
 * 接收聊天室圖片上傳，存到 Supabase Storage（chat-image kind），
 * 寫入 ChatModerationLog（admin audit），回傳 URL 供 client 後續發送 message。
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "未登入" },
      { status: 401 }
    );
  }

  const room = await db.chatRoom.findUnique({ where: { slug: params.slug } });
  if (!room || !room.isActive) {
    return NextResponse.json(
      { success: false, error: "聊天室不存在" },
      { status: 404 }
    );
  }

  // R-18 室需要年齡閘
  if (room.rating === "R18") {
    const u = await db.user.findUnique({
      where: { id: session.user.id },
      select: { ageConfirmedAt: true },
    });
    if (!u?.ageConfirmedAt) {
      return NextResponse.json(
        { success: false, error: "需要先通過 18+ 驗證" },
        { status: 403 }
      );
    }
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json(
      { success: false, error: "請選擇圖片" },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json(
      { success: false, error: "僅支援 JPEG / PNG / WebP / GIF" },
      { status: 400 }
    );
  }

  if (file.size > MAX_CHAT_IMAGE_SIZE) {
    return NextResponse.json(
      { success: false, error: "圖片大小不可超過 5 MB" },
      { status: 400 }
    );
  }

  try {
    const result = await uploadToSupabase(file, {
      kind: "chat-image",
      userId: session.user.id,
    });

    // 審核日誌（admin audit）
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;
    await db.chatModerationLog
      .create({
        data: {
          userId: session.user.id,
          roomId: room.id,
          kind: "image_upload",
          url: result.url,
          detail: `${file.name} • ${file.type} • ${file.size}b`,
          ipAddress: ip,
        },
      })
      .catch(() => null);

    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        path: result.path,
        fileName: file.name,
        fileSize: result.size,
        mimeType: result.type,
      },
    });
  } catch (e) {
    console.error("[chat upload]", e);
    return NextResponse.json(
      { success: false, error: (e as Error).message || "上傳失敗" },
      { status: 500 }
    );
  }
}
