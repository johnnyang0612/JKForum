import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canDo } from "@/lib/user-groups";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const authorId = url.searchParams.get("author");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = 20;

  const where = {
    isPublic: true,
    ...(authorId ? { authorId } : {}),
  };
  const [items, total] = await Promise.all([
    db.blog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profile: { select: { avatarUrl: true } },
          },
        },
      },
    }),
    db.blog.count({ where }),
  ]);

  return NextResponse.json({ success: true, items, total, page, pageSize });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { readPermission: true },
  });
  if (!canDo(me?.readPermission ?? 10, "CREATE_BLOG")) {
    return NextResponse.json(
      { success: false, error: "閱讀權限需 ≥ 30 才能建日誌" },
      { status: 403 }
    );
  }
  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim().slice(0, 200);
  const content = String(body.content ?? "").trim();
  const coverUrl = body.coverUrl ? String(body.coverUrl) : null;
  const isPublic = body.isPublic !== false;
  if (!title || !content) {
    return NextResponse.json(
      { success: false, error: "標題與內容必填" },
      { status: 400 }
    );
  }
  const blog = await db.blog.create({
    data: {
      authorId: session.user.id,
      title,
      content,
      coverUrl,
      isPublic,
    },
  });
  return NextResponse.json({ success: true, blog });
}
