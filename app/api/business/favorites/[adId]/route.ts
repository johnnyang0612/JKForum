import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** 取消收藏（從 sidebar ✕ 按鈕 / 詳情頁 ❤ 取消都可用） */
export async function DELETE(_req: Request, { params }: { params: { adId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  await db.businessAdFavorite.deleteMany({
    where: { userId: session.user.id, adId: params.adId },
  });
  return NextResponse.json({ success: true });
}
