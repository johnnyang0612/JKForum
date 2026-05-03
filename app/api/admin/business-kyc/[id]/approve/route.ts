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

  await db.user.update({
    where: { id: params.id },
    data: { merchantVerified: true },
  });
  await createNotification({
    recipientId: params.id,
    type: "SYSTEM",
    title: "🎉 業者認證通過",
    content: "您的 KYC 文件已通過審核，現在可以申請提現並享有「認證業者」徽章",
    linkUrl: "/business/settings",
  });
  return NextResponse.json({ success: true });
}
