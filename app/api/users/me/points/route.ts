import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }

  const points = await db.userPoints.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    success: true,
    data: points || { reputation: 0, coins: 0, platinum: 0, totalPoints: 0, level: 16 },
  });
}
