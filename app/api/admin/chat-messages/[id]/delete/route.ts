import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { logAdminAction } from "@/lib/admin-log";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.redirect(new URL("/admin", _req.url));
  }

  await db.chatMessage.update({
    where: { id: params.id },
    data: { isDeleted: true, deletedAt: new Date(), content: "[已被管理員刪除]" },
  });
  await logAdminAction({
    adminId: admin.id, action: "SETTINGS_CHANGE",
    targetType: "ChatMessage", targetId: params.id, detail: "[CHAT_MSG_DELETE]",
  });

  revalidatePath("/admin/chat");
  return NextResponse.redirect(new URL("/admin/chat", _req.url));
}
