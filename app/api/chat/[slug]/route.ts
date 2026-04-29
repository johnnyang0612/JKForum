import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 10_000; // 10s
const RATE_LIMIT_MAX = 5;             // 最多 5 則 / 10 秒

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const room = await db.chatRoom.findUnique({ where: { slug: params.slug } });
  if (!room || !room.isActive) {
    return NextResponse.json({ success: false, error: "聊天室不存在" }, { status: 404 });
  }
  const url = new URL(req.url);
  const sinceParam = url.searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 60 * 60 * 1000);

  const messages = await db.chatMessage.findMany({
    where: {
      roomId: room.id,
      isDeleted: false,
      createdAt: { gt: since },
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          userGroup: true,
          profile: { select: { avatarUrl: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json({
    success: true,
    room,
    messages,
    serverTime: new Date().toISOString(),
  });
}

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const room = await db.chatRoom.findUnique({ where: { slug: params.slug } });
  if (!room || !room.isActive) {
    return NextResponse.json({ success: false, error: "聊天室不存在" }, { status: 404 });
  }

  // R-18 室需通過年齡閘
  if (room.rating === "R18") {
    const u = await db.user.findUnique({
      where: { id: session.user.id },
      select: { ageConfirmedAt: true },
    });
    if (!u?.ageConfirmedAt) {
      return NextResponse.json(
        { success: false, error: "需要先通過 18+ 驗證" },
        { status: 403 }
      );
    }
  }

  const body = await req.json().catch(() => ({}));
  const content = String(body.content ?? "").trim().slice(0, 500);
  if (!content) {
    return NextResponse.json({ success: false, error: "內容不可為空" }, { status: 400 });
  }

  // Rate limit: 過去 10 秒最多 5 則
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const recent = await db.chatMessage.count({
    where: { senderId: session.user.id, createdAt: { gt: since } },
  });
  if (recent >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      { success: false, error: "說話太快了，稍微休息一下吧" },
      { status: 429 }
    );
  }

  const msg = await db.chatMessage.create({
    data: { roomId: room.id, senderId: session.user.id, content },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          userGroup: true,
          profile: { select: { avatarUrl: true } },
        },
      },
    },
  });

  return NextResponse.json({ success: true, message: msg });
}
