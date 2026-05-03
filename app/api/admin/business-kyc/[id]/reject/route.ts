import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/services/notification-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
    return NextResponse.json({ success: false, error: "無權限" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const reason = String(body.reason ?? "").trim() || "未說明";

  // 清空文件，業者要重傳
  await db.user.update({
    where: { id: params.id },
    data: { merchantVerifiedDocs: [] },
  });
  await createNotification({
    recipientId: params.id,
    type: "SYSTEM",
    title: "❌ KYC 認證退回",
    content: `退回原因：${reason}\n請至業者設定重新上傳`,
    linkUrl: "/business/settings",
  });
  return NextResponse.json({ success: true });
}
