import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { moderateAsync } from "@/lib/content-moderation";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 1_000; // 每 1 秒最多 1 則（per user per room）
const BURST_WINDOW_MS = 10_000; // 10s burst
const BURST_MAX = 8; // 10 秒內最多 8 則（防爆刷）

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type AttachmentInput = {
  url?: unknown;
  fileName?: unknown;
  mimeType?: unknown;
  fileSize?: unknown;
  width?: unknown;
  height?: unknown;
};

const MSG_INCLUDE = {
  sender: {
    select: {
      id: true,
      username: true,
      displayName: true,
      userGroup: true,
      profile: { select: { avatarUrl: true } },
    },
  },
  replyTo: {
    select: {
      id: true,
      content: true,
      messageType: true,
      isDeleted: true,
      sender: {
        select: { id: true, username: true, displayName: true },
      },
    },
  },
} satisfies Prisma.ChatMessageInclude;

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const room = await db.chatRoom.findUnique({ where: { slug: params.slug } });
  if (!room || !room.isActive) {
    return NextResponse.json(
      { success: false, error: "聊天室不存在" },
      { status: 404 }
    );
  }
  const url = new URL(req.url);
  const sinceParam = url.searchParams.get("since");

  let messages;
  if (sinceParam) {
    messages = await db.chatMessage.findMany({
      where: {
        roomId: room.id,
        createdAt: { gt: new Date(sinceParam) },
      },
      include: MSG_INCLUDE,
      orderBy: { createdAt: "asc" },
      take: 100,
    });
  } else {
    const recent = await db.chatMessage.findMany({
      where: { roomId: room.id },
      include: MSG_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    messages = recent.reverse();
  }

  // 順便更新 ChatRoomRead.lastReadAt（讓未讀計數歸零）— 只在登入時
  const session = await getServerSession(authOptions);
  if (session?.user) {
    await db.chatRoomRead
      .upsert({
        where: {
          userId_roomId: { userId: session.user.id, roomId: room.id },
        },
        create: {
          userId: session.user.id,
          roomId: room.id,
          lastReadAt: new Date(),
        },
        update: { lastReadAt: new Date() },
      })
      .catch(() => null);
  }

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
    return NextResponse.json(
      { success: false, error: "未登入" },
      { status: 401 }
    );
  }
  const room = await db.chatRoom.findUnique({ where: { slug: params.slug } });
  if (!room || !room.isActive) {
    return NextResponse.json(
      { success: false, error: "聊天室不存在" },
      { status: 404 }
    );
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

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const rawContent = String((body as { content?: unknown }).content ?? "").trim();
  const content = rawContent.slice(0, 2000); // 訊息內容上限 2000 字（content 欄位已升 TEXT）
  const replyToIdRaw = (body as { replyToId?: unknown }).replyToId;
  const replyToId =
    typeof replyToIdRaw === "string" && replyToIdRaw.length > 0 ? replyToIdRaw : null;
  const attachmentsRaw = (body as { attachments?: unknown }).attachments;
  const attachmentsInput: AttachmentInput[] = Array.isArray(attachmentsRaw)
    ? (attachmentsRaw as AttachmentInput[])
    : [];

  // 清理 attachments — 只接受白名單 MIME
  const attachments = attachmentsInput
    .map((a) => ({
      url: typeof a.url === "string" ? a.url : "",
      fileName: typeof a.fileName === "string" ? a.fileName.slice(0, 200) : "image",
      mimeType: typeof a.mimeType === "string" ? a.mimeType : "",
      fileSize: typeof a.fileSize === "number" ? a.fileSize : 0,
      width: typeof a.width === "number" ? a.width : null,
      height: typeof a.height === "number" ? a.height : null,
    }))
    .filter((a) => a.url && ALLOWED_MIME.includes(a.mimeType))
    .slice(0, 4); // 一則訊息最多 4 張圖

  if (!content && attachments.length === 0) {
    return NextResponse.json(
      { success: false, error: "內容不可為空" },
      { status: 400 }
    );
  }

  // 1. Per-second rate limit (1 則/秒/用戶/聊天室)
  const tinyWindow = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const recentInRoom = await db.chatMessage.count({
    where: {
      senderId: session.user.id,
      roomId: room.id,
      createdAt: { gt: tinyWindow },
    },
  });
  if (recentInRoom >= 1) {
    return NextResponse.json(
      { success: false, error: "說話太快了，請稍候再試" },
      { status: 429 }
    );
  }

  // 2. Burst rate limit (8 則/10 秒)
  const burstWindow = new Date(Date.now() - BURST_WINDOW_MS);
  const burst = await db.chatMessage.count({
    where: { senderId: session.user.id, createdAt: { gt: burstWindow } },
  });
  if (burst >= BURST_MAX) {
    return NextResponse.json(
      { success: false, error: "說話太快了，稍微休息一下吧" },
      { status: 429 }
    );
  }

  // 3. 違禁詞攔截
  if (content) {
    const mod = await moderateAsync(content);
    if (!mod.ok) {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        null;
      await db.chatModerationLog
        .create({
          data: {
            userId: session.user.id,
            roomId: room.id,
            kind: "banned_word_block",
            detail: `blocked: ${mod.blocked.join(", ")}`,
            ipAddress: ip,
          },
        })
        .catch(() => null);
      return NextResponse.json(
        {
          success: false,
          error: `訊息含禁用字詞：${mod.blocked.slice(0, 3).join("、")}`,
        },
        { status: 422 }
      );
    }
  }

  // 4. 驗證 replyTo 存在且同一個聊天室
  let validReplyToId: string | null = null;
  if (replyToId) {
    const target = await db.chatMessage.findUnique({
      where: { id: replyToId },
      select: { id: true, roomId: true, isDeleted: true },
    });
    if (target && target.roomId === room.id && !target.isDeleted) {
      validReplyToId = target.id;
    }
  }

  const messageType = attachments.length > 0 && !content ? "IMAGE" : "TEXT";

  const msg = await db.chatMessage.create({
    data: {
      roomId: room.id,
      senderId: session.user.id,
      content,
      messageType,
      attachments,
      replyToId: validReplyToId,
    },
    include: MSG_INCLUDE,
  });

  return NextResponse.json({ success: true, message: msg });
}
