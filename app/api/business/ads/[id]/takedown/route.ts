import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });

  const ad = await db.businessAd.findUnique({ where: { id: params.id }, select: { merchantId: true, status: true } });
  if (!ad || ad.merchantId !== session.user.id) return NextResponse.json({ success: false, error: "找不到" }, { status: 404 });
  if (ad.status !== "ACTIVE") return NextResponse.json({ success: false, error: "非上架狀態" }, { status: 400 });

  await db.businessAd.update({
    where: { id: params.id },
    data: { status: "TAKEN_DOWN" },
  });
  return NextResponse.json({ success: true });
}
