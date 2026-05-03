import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/services/notification-service";

export const dynamic = "force-dynamic";
const FEE = 30;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ success: false, error: "無權限" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const reason = String(body.reason ?? "").trim() || "未說明";

  const w = await db.withdrawalRequest.findUnique({ where: { id: params.id } });
  if (!w) return NextResponse.json({ success: false, error: "找不到" }, { status: 404 });
  if (w.status !== "PENDING") return NextResponse.json({ success: false, error: "非待審" }, { status: 400 });

  // 退錢回錢包（含手續費 30）
  const refund = w.amount + FEE;

  await db.$transaction(async (tx) => {
    const wallet = await tx.businessWallet.update({
      where: { merchantId: w.merchantId },
      data: { balance: { increment: refund } },
    });
    await tx.businessWalletTx.create({
      data: {
        merchantId: w.merchantId,
        type: "REFUND",
        amount: refund,
        balance: wallet.balance,
        relatedId: w.id,
        note: `提現退回：${reason}`,
      },
    });
    await tx.withdrawalRequest.update({
      where: { id: params.id },
      data: {
        status: "REJECTED", rejectReason: reason,
        reviewedBy: session.user.id, reviewedAt: new Date(),
      },
    });
  });

  await createNotification({
    recipientId: w.merchantId,
    type: "SYSTEM",
    title: "❌ 提現申請退回",
    content: `退回原因：${reason}\n已退款 NT$${refund.toLocaleString()} 至錢包`,
    linkUrl: "/business/withdraw",
    relatedId: w.id,
  });

  return NextResponse.json({ success: true });
}
