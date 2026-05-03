/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/services/notification-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ success: false, error: "無權限" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const userIds = Array.isArray(body.userIds) ? body.userIds.slice(0, 200).map((s: any) => String(s)) : [];
  const action = String(body.action ?? "");
  if (userIds.length === 0) return NextResponse.json({ success: false, error: "未選擇" }, { status: 400 });

  let count = 0;
  if (action === "ban") {
    const r = await db.user.updateMany({
      where: { id: { in: userIds }, role: { notIn: ["ADMIN", "SUPER_ADMIN"] } },
      data: { status: "BANNED" },
    });
    count = r.count;
  } else if (action === "unban") {
    const r = await db.user.updateMany({
      where: { id: { in: userIds } },
      data: { status: "ACTIVE" },
    });
    count = r.count;
  } else if (action === "notify") {
    const title = String(body.title ?? "").slice(0, 100);
    const content = String(body.content ?? "").slice(0, 500);
    if (!title) return NextResponse.json({ success: false, error: "缺標題" }, { status: 400 });
    for (const id of userIds) {
      await createNotification({
        recipientId: id, type: "SYSTEM",
        title, content, senderId: session.user.id,
      }).catch(() => null);
      count++;
    }
  } else {
    return NextResponse.json({ success: false, error: "未知動作" }, { status: 400 });
  }

  return NextResponse.json({ success: true, count });
}
