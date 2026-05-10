import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { logAdminAction } from "@/lib/admin-log";

function genTempPassword(len = 12) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  const b = randomBytes(len);
  let s = "";
  for (let i = 0; i < len; i++) s += chars[b[i] % chars.length];
  return s;
}

export async function POST(_req: NextRequest, ctx: { params: { userId: string } }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "未授權" }, { status: 403 });
  }

  const target = await db.user.findUnique({
    where: { id: ctx.params.userId },
    select: { id: true, email: true },
  });
  if (!target) return NextResponse.json({ error: "使用者不存在" }, { status: 404 });

  const tempPassword = genTempPassword(12);
  const hashed = await bcrypt.hash(tempPassword, 12);

  await db.user.update({
    where: { id: ctx.params.userId },
    data: { hashedPassword: hashed },
  });

  await logAdminAction({
    adminId: admin.id,
    action: "SETTINGS_CHANGE",
    targetType: "User",
    targetId: ctx.params.userId,
    detail: `[USER_PASSWORD_RESET] by admin`,
  });

  return NextResponse.json({ ok: true, tempPassword });
}
