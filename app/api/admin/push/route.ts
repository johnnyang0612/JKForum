/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { broadcastPush, sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (me?.role !== "ADMIN" && me?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, error: "需要管理員權限" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { title, body: msgBody, url, image, target, userId } = body;
  if (!title) {
    return NextResponse.json({ success: false, error: "缺少 title" }, { status: 400 });
  }

  const payload = {
    title: String(title).slice(0, 100),
    body: msgBody ? String(msgBody).slice(0, 300) : undefined,
    url: url ?? "/",
    image: image || undefined,
    tag: "jkforum-admin-broadcast",
  };

  let result;
  if (target === "user" && userId) {
    result = await sendPushToUser(userId, payload);
  } else {
    result = await broadcastPush(payload);
  }

  await db.adminLog.create({
    data: {
      adminId: session.user.id,
      action: "SETTINGS_CHANGE",
      targetType: target === "user" ? "user" : "broadcast",
      targetId: userId ?? "all",
      detail: `Push: "${title}" — sent ${result.sent}, failed ${result.failed}, expired ${result.expired}`,
    },
  });

  return NextResponse.json({ success: true, ...result });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (me?.role !== "ADMIN" && me?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, error: "需要管理員權限" }, { status: 403 });
  }

  const total = await db.pushSubscription.count();
  const byUser = await db.pushSubscription.count({ where: { userId: { not: null } } });
  return NextResponse.json({
    success: true,
    total,
    authenticatedSubs: byUser,
    anonymousSubs: total - byUser,
  });
}
