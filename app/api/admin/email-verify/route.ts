/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, id: true },
  });
  if (!me || (me.role !== "ADMIN" && me.role !== "SUPER_ADMIN")) return null;
  return me;
}

// 後台一鍵把指定 user 的 email 標為已驗證 (demo + 客服救援用)
export async function POST(req: Request) {
  const me = await requireAdmin();
  if (!me) {
    return NextResponse.json({ success: false, error: "需管理員權限" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId ?? "");
  if (!userId) {
    return NextResponse.json({ success: false, error: "缺 userId" }, { status: 400 });
  }
  const u = await db.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } });
  if (!u) {
    return NextResponse.json({ success: false, error: "用戶不存在" }, { status: 404 });
  }
  if (u.emailVerified) {
    return NextResponse.json({ success: false, error: "已驗證過" }, { status: 400 });
  }
  await db.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  });
  await db.verificationToken.deleteMany({ where: { identifier: u.email } });
  await db.adminLog.create({
    data: {
      adminId: me.id,
      action: "SETTINGS_CHANGE",
      targetType: "user",
      targetId: userId,
      detail: `Manually marked email verified: ${u.email}`,
    },
  });
  return NextResponse.json({ success: true });
}

// 後台一鍵把 SMS 也驗證（demo 用）
export async function PUT(req: Request) {
  const me = await requireAdmin();
  if (!me) {
    return NextResponse.json({ success: false, error: "需管理員權限" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId ?? "");
  if (!userId) {
    return NextResponse.json({ success: false, error: "缺 userId" }, { status: 400 });
  }
  await db.user.update({
    where: { id: userId },
    data: { smsVerified: new Date(), phoneNumber: "0900000000", phoneCountry: "+886" },
  });
  await db.adminLog.create({
    data: {
      adminId: me.id,
      action: "SETTINGS_CHANGE",
      targetType: "user",
      targetId: userId,
      detail: "Manually marked SMS verified (demo)",
    },
  });
  return NextResponse.json({ success: true });
}
