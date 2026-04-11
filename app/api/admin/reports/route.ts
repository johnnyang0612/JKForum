import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ success: false, error: "沒有權限" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const reportId = searchParams.get("reportId");

  // Single report detail
  if (reportId) {
    const report = await db.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: { select: { id: true, displayName: true, username: true } },
      },
    });

    if (!report) {
      return NextResponse.json({ success: false, error: "檢舉不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: report });
  }

  // Report list
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = 20;
  const status = searchParams.get("status") || "PENDING";

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;

  const [reports, total] = await Promise.all([
    db.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        reporter: { select: { displayName: true, username: true } },
      },
    }),
    db.report.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: reports,
    meta: { total, page, pageSize: limit, totalPages: Math.ceil(total / limit), hasMore: page * limit < total },
  });
}
