import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/services/notification-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, error: "無權限" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const reason = String(body.reason ?? "").trim() || "違反規範";

  const ad = await db.businessAd.findUnique({ where: { id: params.id }, select: { merchantId: true, title: true } });
  if (!ad) return NextResponse.json({ success: false, error: "找不到" }, { status: 404 });

  await db.businessAd.update({
    where: { id: params.id },
    data: { status: "REMOVED", rejectReason: reason },
  });

  await createNotification({
    recipientId: ad.merchantId,
    type: "SYSTEM",
    title: "⚠️ 廣告遭管理員下架",
    content: `「${ad.title}」原因：${reason}\n注意：強制下架不退款`,
    linkUrl: `/business/ads/${params.id}`,
    relatedId: params.id,
  });

  return NextResponse.json({ success: true });
}
