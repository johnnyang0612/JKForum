/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/services/notification-service";
import { logAdminAction } from "@/lib/admin-log";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, error: "無權限" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const reason = String(body.reason ?? "").trim() || "未說明";

  const ad = await db.businessAd.findUnique({ where: { id: params.id } });
  if (!ad) return NextResponse.json({ success: false, error: "找不到" }, { status: 404 });
  if (ad.status !== "PENDING") return NextResponse.json({ success: false, error: "非待審狀態" }, { status: 400 });

  await db.$transaction(async (tx) => {
    await tx.businessAd.update({
      where: { id: params.id },
      data: { status: "REJECTED", rejectReason: reason },
    });
    if (ad.tierAmountTwd > 0) {
      const w = await tx.businessWallet.update({
        where: { merchantId: ad.merchantId },
        data: {
          balance: { increment: ad.tierAmountTwd },
          totalSpent: { decrement: ad.tierAmountTwd },
        },
      });
      await tx.businessWalletTx.create({
        data: {
          merchantId: ad.merchantId,
          type: "REFUND",
          amount: ad.tierAmountTwd,
          balance: w.balance,
          relatedId: ad.id,
          note: `退審退款：${reason}`,
        },
      });
    }
  });

  await logAdminAction({
    adminId: session.user.id, action: "BUSINESS_AD_REJECT",
    targetType: "BusinessAd", targetId: params.id,
    detail: `退回：${reason} | 退款 ${ad.tierAmountTwd}`,
  });
  await createNotification({
    recipientId: ad.merchantId,
    type: "SYSTEM",
    title: "❌ 廣告審核退回",
    content: `「${ad.title}」退回原因：${reason}${ad.tierAmountTwd > 0 ? `\n已退款 NT$${ad.tierAmountTwd.toLocaleString()} 至錢包` : ""}`,
    linkUrl: `/business/ads/${params.id}`,
    relatedId: params.id,
  });

  return NextResponse.json({ success: true });
}
