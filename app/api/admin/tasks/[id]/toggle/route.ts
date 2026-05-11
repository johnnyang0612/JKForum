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
    return NextResponse.json({ error: "未授權" }, { status: 403 });
  }

  const t = await db.task.findUnique({ where: { id: params.id }, select: { isActive: true, name: true } });
  if (!t) return NextResponse.json({ error: "任務不存在" }, { status: 404 });

  const next = !t.isActive;
  await db.task.update({ where: { id: params.id }, data: { isActive: next } });
  await logAdminAction({
    adminId: admin.id, action: "SETTINGS_CHANGE",
    targetType: "Task", targetId: params.id,
    detail: `[TASK_TOGGLE] ${t.name} → ${next ? "啟用" : "停用"}`,
  });
  revalidatePath("/admin/tasks");
  revalidatePath("/tasks");

  return NextResponse.json({ ok: true, isActive: next });
}
