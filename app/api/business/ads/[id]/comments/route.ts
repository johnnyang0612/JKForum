/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { moderateAsync } from "@/lib/content-moderation";
import { createNotification } from "@/lib/services/notification-service";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const ad = await db.businessAd.findUnique({ where: { id: params.id }, select: { merchantId: true } });
  if (!ad) return NextResponse.json({ success: false, error: "找不到" }, { status: 404 });

  const comments = await db.businessAdComment.findMany({
    where: { adId: params.id },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  const userIds = Array.from(new Set(comments.map((c) => c.userId)));
  const users = userIds.length
    ? await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, displayName: true, profile: { select: { avatarUrl: true } } },
      })
    : [];
  const uMap = new Map(users.map((u) => [u.id, u]));

  return NextResponse.json({
    success: true,
    list: comments.map((c) => {
      const u = uMap.get(c.userId);
      return {
        id: c.id, content: c.content, createdAt: c.createdAt,
        isDeleted: c.isDeleted,
        user: {
          id: c.userId,
          displayName: u?.displayName ?? "—",
          avatarUrl: u?.profile?.avatarUrl ?? null,
          isMerchant: c.userId === ad.merchantId,
        },
        isOwner: !!session?.user && (session.user.id === c.userId || session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN"),
      };
    }),
  });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const content = String(body.content ?? "").trim();
  if (content.length < 1 || content.length > 500) {
    return NextResponse.json({ success: false, error: "1~500 字" }, { status: 400 });
  }

  const mod = await moderateAsync(content);
  if (!mod.ok) {
    return NextResponse.json({ success: false, error: `含違禁詞：${mod.blocked.join("、")}` }, { status: 400 });
  }

  const ad = await db.businessAd.findUnique({ where: { id: params.id }, select: { merchantId: true, title: true } });
  if (!ad) return NextResponse.json({ success: false, error: "找不到" }, { status: 404 });

  const c = await db.businessAdComment.create({
    data: { adId: params.id, userId: session.user.id, content: mod.cleanedText ?? content },
  });

  // 通知業者（自己留言不通知）
  if (session.user.id !== ad.merchantId) {
    await createNotification({
      recipientId: ad.merchantId,
      type: "REPLY",
      title: "💬 廣告新留言",
      content: `「${ad.title}」收到新留言`,
      linkUrl: `/listing/ad/${params.id}#comments`,
      senderId: session.user.id,
      relatedId: params.id,
    }).catch(() => null);
  }

  return NextResponse.json({ success: true, id: c.id });
}
