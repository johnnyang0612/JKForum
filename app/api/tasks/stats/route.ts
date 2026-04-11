import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTaskStats } from "@/lib/services/task-service";

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
    const stats = await getTaskStats(session.user.id);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get task stats error:", error);
    return NextResponse.json(
      { success: false, error: "載入任務統計失敗" },
      { status: 500 }
    );
  }
}
