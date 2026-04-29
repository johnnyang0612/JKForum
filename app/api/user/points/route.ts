import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "未登入" },
      { status: 401 }
    );
  }

  try {
    const points = await db.userPoints.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      success: true,
      data: {
        reputation: points?.reputation || 0,
        coins: points?.coins || 0,
        platinum: points?.platinum || 0,
        hearts: points?.hearts || 0,
        gems: points?.gems || 0,
        given: points?.given || 0,
        energy: points?.energy ?? 100,
        invites: points?.invites || 0,
        totalPoints: points?.totalPoints || 0,
        level: points?.level || 16,
      },
    });
  } catch (error) {
    console.error("Get user points error:", error);
    return NextResponse.json(
      { success: false, error: "載入積分失敗" },
      { status: 500 }
    );
  }
}
