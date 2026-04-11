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
  const userId = searchParams.get("userId");

  // Single user detail
  if (userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        points: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "用戶不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  }

  // User list
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = 20;
  const q = searchParams.get("q")?.trim();

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { username: { contains: q, mode: "insensitive" } },
      { displayName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        profile: { select: { avatarUrl: true } },
        points: { select: { level: true } },
      },
    }),
    db.user.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: users,
    meta: { total, page, pageSize: limit, totalPages: Math.ceil(total / limit), hasMore: page * limit < total },
  });
}
