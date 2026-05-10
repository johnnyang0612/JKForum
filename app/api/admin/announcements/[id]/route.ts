import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { logAdminAction } from "@/lib/admin-log";
import { revalidatePath } from "next/cache";

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "未授權" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim().slice(0, 200);
  if (typeof body.body === "string" && body.body.trim()) data.body = body.body.trim().slice(0, 5000);
  if (["INFO", "WARNING", "CRITICAL"].includes(body.severity)) data.severity = body.severity;
  if (typeof body.isPinned === "boolean") data.isPinned = body.isPinned;
  if (body.startAt !== undefined) data.startAt = body.startAt ? new Date(body.startAt) : null;
  if (body.endAt !== undefined) data.endAt = body.endAt ? new Date(body.endAt) : null;

  try {
    await db.announcement.update({ where: { id: ctx.params.id }, data });
    await logAdminAction({
      adminId: admin.id,
      action: "SETTINGS_CHANGE",
      targetType: "Announcement",
      targetId: ctx.params.id,
      detail: `[ANNOUNCEMENT_UPDATE]`,
    });
    revalidatePath("/admin/announcements");
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "更新失敗" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "未授權" }, { status: 403 });
  }

  try {
    await db.announcement.delete({ where: { id: ctx.params.id } });
    await logAdminAction({
      adminId: admin.id,
      action: "SETTINGS_CHANGE",
      targetType: "Announcement",
      targetId: ctx.params.id,
      detail: `[ANNOUNCEMENT_DELETE]`,
    });
    revalidatePath("/admin/announcements");
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "刪除失敗" }, { status: 400 });
  }
}
