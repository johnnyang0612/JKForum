import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const forumId = searchParams.get("forumId");

  // Single forum detail
  if (forumId) {
    const forum = await db.forum.findUnique({
      where: { id: forumId },
      include: { category: true },
    });
    return NextResponse.json({ success: true, data: { forum } });
  }

  // All categories with forums
  const categories = await db.category.findMany({
    where: { isVisible: true },
    orderBy: { sortOrder: "asc" },
    include: {
      forums: {
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return NextResponse.json({ success: true, data: { categories } });
}
