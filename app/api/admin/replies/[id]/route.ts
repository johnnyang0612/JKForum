import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { logAdminAction } from "@/lib/admin-log";
import { revalidatePath } from "next/cache";

export async function DELETE(req: NextRequest, ctx: { params: { id: string } }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "未授權" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const reason = String(body.reason ?? "").trim() || "管理員刪除";

  const reply = await db.reply.findUnique({
    where: { id: ctx.params.id },
    select: { postId: true },
  });
  if (!reply) return NextResponse.json({ error: "回覆不存在" }, { status: 404 });

  await db.reply.update({
    where: { id: ctx.params.id },
    data: { status: "DELETED" },
  });
  await db.post.update({
    where: { id: reply.postId },
    data: { replyCount: { decrement: 1 } },
  });

  await logAdminAction({
    adminId: admin.id,
    action: "REPLY_DELETE",
    targetType: "Reply",
    targetId: ctx.params.id,
    detail: reason,
  });

  revalidatePath("/admin/replies");
  revalidatePath(`/posts/${reply.postId}`);

  return NextResponse.json({ ok: true });
}
