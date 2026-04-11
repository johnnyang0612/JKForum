import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parsePaginationParams } from "@/lib/utils/pagination";
import { createPaginationMeta } from "@/types/api";

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  const { searchParams } = new URL(req.url);
  const { page, limit } = parsePaginationParams({
    page: searchParams.get("page") || undefined,
    limit: searchParams.get("pageSize") || "30",
  });

  const where = {
    postId: params.postId,
    parentId: null as string | null,
    status: { not: "DELETED" as const },
  };

  const [replies, total] = await Promise.all([
    db.reply.findMany({
      where,
      orderBy: { floor: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: {
          select: {
            id: true, username: true, displayName: true,
            profile: { select: { avatarUrl: true } },
            points: { select: { level: true } },
          },
        },
        children: {
          where: { status: { not: "DELETED" } },
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true, username: true, displayName: true,
                profile: { select: { avatarUrl: true } },
                points: { select: { level: true } },
              },
            },
          },
        },
      },
    }),
    db.reply.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: replies,
    meta: createPaginationMeta(total, page, limit),
  });
}
