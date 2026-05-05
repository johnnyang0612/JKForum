import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const RECALL_WINDOW_MS = 5 * 60_000; // 5 分鐘內可撤回

/**
 * DELETE /api/chat/[slug]/[messageId]
 * 軟刪除訊息（撤回）。
 * - 訊息發送者：5 分鐘內可撤回（顯示為「訊息已撤回」）
 * - 管理員：永遠可刪除（沒有時間限制）
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string; messageId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "未登入" },
      { status: 401 }
    );
  }
  const msg = await db.chatMessage.findUnique({
    where: { id: params.messageId },
  });
  if (!msg) {
    return NextResponse.json(
      { success: false, error: "訊息不存在" },
      { status: 404 }
    );
  }
  if (msg.isDeleted) {
    return NextResponse.json({ success: true });
  }

  const isOwner = msg.senderId === session.user.id;
  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  const isAdmin = me?.role === "ADMIN" || me?.role === "SUPER_ADMIN";

  if (!isOwner && !isAdmin) {
    return NextResponse.json(
      { success: false, error: "無權限" },
      { status: 403 }
    );
  }

  if (isOwner && !isAdmin) {
    const ageMs = Date.now() - new Date(msg.createdAt).getTime();
    if (ageMs > RECALL_WINDOW_MS) {
      return NextResponse.json(
        { success: false, error: "訊息已超過 5 分鐘，無法撤回" },
        { status: 403 }
      );
    }
  }

  await db.chatMessage.update({
    where: { id: params.messageId },
    data: { isDeleted: true, deletedAt: new Date() },
  });
  return NextResponse.json({ success: true });
}
