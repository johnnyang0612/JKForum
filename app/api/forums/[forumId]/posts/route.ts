import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parsePaginationParams } from "@/lib/utils/pagination";
import { createPaginationMeta } from "@/types/api";

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { forumId: string } }
) {
  const { searchParams } = new URL(req.url);
  const { page, limit } = parsePaginationParams({
    page: searchParams.get("page") || undefined,
    limit: searchParams.get("pageSize") || undefined,
  });
  const sort = searchParams.get("sort") || "latest";

  let orderBy: Record<string, string> = {};
  switch (sort) {
    case "popular": orderBy = { likeCount: "desc" }; break;
    case "featured": orderBy = { featuredAt: "desc" }; break;
    case "active": orderBy = { lastReplyAt: "desc" }; break;
    default: orderBy = { createdAt: "desc" };
  }

  const where = {
    forumId: params.forumId,
    status: "PUBLISHED" as const,
    ...(sort === "featured" ? { isFeatured: true } : {}),
  };

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      orderBy,
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
        tags: { include: { tag: true } },
      },
    }),
    db.post.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: posts,
    meta: createPaginationMeta(total, page, limit),
  });
}
