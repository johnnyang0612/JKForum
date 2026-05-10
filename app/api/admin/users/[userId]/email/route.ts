import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { logAdminAction } from "@/lib/admin-log";

export async function PATCH(req: NextRequest, ctx: { params: { userId: string } }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "未授權" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const newEmail = String(body.email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) {
    return NextResponse.json({ error: "Email 格式不合法" }, { status: 400 });
  }

  const target = await db.user.findUnique({
    where: { id: ctx.params.userId },
    select: { email: true },
  });
  if (!target) return NextResponse.json({ error: "使用者不存在" }, { status: 404 });
  if (target.email === newEmail) {
    return NextResponse.json({ error: "Email 沒有變更" }, { status: 400 });
  }
  const dup = await db.user.findUnique({ where: { email: newEmail } });
  if (dup) return NextResponse.json({ error: "此 email 已被其他帳號使用" }, { status: 400 });

  await db.user.update({
    where: { id: ctx.params.userId },
    data: { email: newEmail, emailVerified: null }, // 改了要重新驗證
  });

  await logAdminAction({
    adminId: admin.id,
    action: "SETTINGS_CHANGE",
    targetType: "User",
    targetId: ctx.params.userId,
    detail: `[USER_EMAIL_CHANGE] ${target.email} → ${newEmail}`,
  });

  return NextResponse.json({ ok: true });
}
