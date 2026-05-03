import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/services/notification-service";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ success: false, error: "無權限" }, { status: 403 });

  const w = await db.withdrawalRequest.findUnique({ where: { id: params.id } });
  if (!w) return NextResponse.json({ success: false, error: "找不到" }, { status: 404 });
  if (w.status !== "PENDING") return NextResponse.json({ success: false, error: "非待審" }, { status: 400 });

  await db.withdrawalRequest.update({
    where: { id: params.id },
    data: { status: "APPROVED", reviewedBy: session.user.id, reviewedAt: new Date() },
  });

  await createNotification({
    recipientId: w.merchantId,
    type: "SYSTEM",
    title: "✅ 提現申請已核准",
    content: `NT$${w.amount.toLocaleString()} 將於 3-5 個工作日內撥款`,
    linkUrl: "/business/withdraw",
    relatedId: w.id,
  });

  return NextResponse.json({ success: true });
}
