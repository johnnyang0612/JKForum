import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ success: false, error: "沒有權限" }, { status: 403 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalUsers, todayPosts, pendingReports, totalPosts] = await Promise.all([
    db.user.count({ where: { status: "ACTIVE" } }),
    db.post.count({ where: { createdAt: { gte: today }, status: "PUBLISHED" } }),
    db.report.count({ where: { status: "PENDING" } }),
    db.post.count({ where: { status: "PUBLISHED" } }),
  ]);

  return NextResponse.json({
    success: true,
    data: { totalUsers, todayPosts, pendingReports, totalPosts },
  });
}
