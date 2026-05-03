/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/services/notification-service";
import { logAdminAction } from "@/lib/admin-log";

export const dynamic = "force-dynamic";

const TIER_RANK: Record<string, number> = { T3000: 50000, T2000: 20000, T1000: 10000, T500: 5000, FREE: 100 };

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, error: "無權限" }, { status: 403 });
  }

  const ad = await db.businessAd.findUnique({ where: { id: params.id }, select: { status: true, tier: true, title: true, merchantId: true } });
  if (!ad) return NextResponse.json({ success: false, error: "找不到" }, { status: 404 });
  if (ad.status !== "PENDING") return NextResponse.json({ success: false, error: "非待審狀態" }, { status: 400 });

  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 86400000);
  const sortBase = TIER_RANK[ad.tier] ?? 100;

  await db.businessAd.update({
    where: { id: params.id },
    data: {
      status: "ACTIVE",
      publishedAt: now,
      expiresAt: expires,
      sortWeight: sortBase + Math.random(), // 同 tier 內加微小亂數避免完全並列
    },
  });

  await createNotification({
    recipientId: ad.merchantId,
    type: "SYSTEM",
    title: "✅ 廣告審核通過",
    content: `「${ad.title}」已上架，30 天後自動下架`,
    linkUrl: `/business/ads/${params.id}`,
    relatedId: params.id,
  });
  await logAdminAction({
    adminId: session.user.id, action: "BUSINESS_AD_APPROVE",
    targetType: "BusinessAd", targetId: params.id,
    detail: `通過 ${ad.title} (tier=${ad.tier})`,
  });

  return NextResponse.json({ success: true });
}
