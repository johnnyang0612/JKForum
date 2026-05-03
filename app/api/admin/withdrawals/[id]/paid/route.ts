import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/services/notification-service";
import { logAdminAction } from "@/lib/admin-log";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ success: false, error: "無權限" }, { status: 403 });

  const w = await db.withdrawalRequest.findUnique({ where: { id: params.id } });
  if (!w) return NextResponse.json({ success: false, error: "找不到" }, { status: 404 });
  if (w.status !== "APPROVED") return NextResponse.json({ success: false, error: "未核准" }, { status: 400 });

  await db.$transaction(async (tx) => {
    await tx.withdrawalRequest.update({
      where: { id: params.id },
      data: { status: "PAID", paidAt: new Date() },
    });
    await tx.businessWallet.update({
      where: { merchantId: w.merchantId },
      data: { totalWithdraw: { increment: w.amount } },
    });
  });

  await logAdminAction({
    adminId: session.user.id, action: "WITHDRAWAL_PAID",
    targetType: "WithdrawalRequest", targetId: params.id, detail: `已撥款 NT$ ${w.amount}`,
  });
  await createNotification({
    recipientId: w.merchantId,
    type: "SYSTEM",
    title: "💰 提現已撥款",
    content: `NT$${w.amount.toLocaleString()} 已匯入您的 ${w.bankCode} 銀行帳戶`,
    linkUrl: "/business/withdraw",
    relatedId: w.id,
  });

  return NextResponse.json({ success: true });
}
