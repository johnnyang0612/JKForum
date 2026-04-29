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

// 頒發勳章給用戶
export async function POST(req: Request) {
  const me = await requireAdmin();
  if (!me) {
    return NextResponse.json({ success: false, error: "需要管理員權限" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId ?? "");
  const medalSlug = String(body.medalSlug ?? "");
  const note = body.note ? String(body.note) : null;
  if (!userId || !medalSlug) {
    return NextResponse.json({ success: false, error: "缺少參數" }, { status: 400 });
  }
  const medal = await db.medal.findUnique({ where: { slug: medalSlug } });
  if (!medal) {
    return NextResponse.json({ success: false, error: "勳章不存在" }, { status: 404 });
  }
  try {
    await db.userMedal.create({
      data: { userId, medalId: medal.id, awardedBy: me.id, note },
    });
    await db.adminLog.create({
      data: {
        adminId: me.id,
        action: "POINTS_ADJUST",
        targetType: "user",
        targetId: userId,
        detail: `Awarded medal: ${medal.name} (${medalSlug})`,
      },
    });
    return NextResponse.json({ success: true, medal });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.code === "P2002" ? "用戶已持有該勳章" : e.message },
      { status: 400 }
    );
  }
}

// 收回勳章
export async function DELETE(req: Request) {
  const me = await requireAdmin();
  if (!me) {
    return NextResponse.json({ success: false, error: "需要管理員權限" }, { status: 403 });
  }
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const medalSlug = url.searchParams.get("medalSlug");
  if (!userId || !medalSlug) {
    return NextResponse.json({ success: false, error: "缺少參數" }, { status: 400 });
  }
  const medal = await db.medal.findUnique({ where: { slug: medalSlug } });
  if (!medal) {
    return NextResponse.json({ success: false, error: "勳章不存在" }, { status: 404 });
  }
  await db.userMedal.delete({
    where: { userId_medalId: { userId, medalId: medal.id } },
  });
  await db.adminLog.create({
    data: {
      adminId: me.id,
      action: "POINTS_ADJUST",
      targetType: "user",
      targetId: userId,
      detail: `Revoked medal: ${medal.name} (${medalSlug})`,
    },
  });
  return NextResponse.json({ success: true });
}
