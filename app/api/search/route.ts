import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const type = searchParams.get("type");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("pageSize")) || 20));

  if (!q) {
    return NextResponse.json({ success: false, error: "請輸入搜尋關鍵字" }, { status: 400 });
  }

  const results: Array<{
    type: string; id: string; title: string; excerpt?: string; url: string; createdAt?: Date;
  }> = [];

  if (!type || type === "post") {
    const posts = await db.post.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: type === "post" ? limit : 10,
      skip: type === "post" ? (page - 1) * limit : 0,
      select: { id: true, title: true, excerpt: true, createdAt: true },
    });
    results.push(...posts.map((p) => ({
      type: "post", id: p.id, title: p.title, excerpt: p.excerpt || undefined, url: `/posts/${p.id}`, createdAt: p.createdAt,
    })));
  }

  if (!type || type === "user") {
    const users = await db.user.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
        ],
      },
      take: type === "user" ? limit : 5,
      skip: type === "user" ? (page - 1) * limit : 0,
      select: { id: true, username: true, displayName: true },
    });
    results.push(...users.map((u) => ({
      type: "user", id: u.id, title: u.displayName, excerpt: `@${u.username}`, url: `/profile/${u.id}`,
    })));
  }

  if (!type || type === "forum") {
    const forums = await db.forum.findMany({
      where: {
        isVisible: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      take: type === "forum" ? limit : 5,
      skip: type === "forum" ? (page - 1) * limit : 0,
      select: { id: true, name: true, description: true, slug: true, category: { select: { slug: true } } },
    });
    results.push(...forums.map((f) => ({
      type: "forum", id: f.id, title: f.name, excerpt: f.description || undefined, url: `/forums/${f.category.slug}/${f.slug}`,
    })));
  }

  return NextResponse.json({ success: true, data: results });
}
