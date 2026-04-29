import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const blog = await db.blog.findUnique({
    where: { id: params.id },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profile: { select: { avatarUrl: true } },
        },
      },
      comments: {
        orderBy: { createdAt: "asc" },
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
      },
    },
  });
  if (!blog || (!blog.isPublic && blog.authorId !== (await getServerSession(authOptions))?.user?.id)) {
    return NextResponse.json({ success: false, error: "日誌不存在" }, { status: 404 });
  }
  // 增加 viewCount
  await db.blog.update({ where: { id: params.id }, data: { viewCount: { increment: 1 } } });
  return NextResponse.json({ success: true, blog });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const blog = await db.blog.findUnique({ where: { id: params.id } });
  if (!blog) {
    return NextResponse.json({ success: false, error: "日誌不存在" }, { status: 404 });
  }
  if (blog.authorId !== session.user.id) {
    return NextResponse.json({ success: false, error: "無權限" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const updated = await db.blog.update({
    where: { id: params.id },
    data: {
      title: body.title ?? undefined,
      content: body.content ?? undefined,
      coverUrl: body.coverUrl ?? undefined,
      isPublic: body.isPublic ?? undefined,
    },
  });
  return NextResponse.json({ success: true, blog: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  const blog = await db.blog.findUnique({ where: { id: params.id } });
  if (!blog) {
    return NextResponse.json({ success: false, error: "日誌不存在" }, { status: 404 });
  }
  const isOwner = blog.authorId === session.user.id;
  const isAdmin = me?.role === "ADMIN" || me?.role === "SUPER_ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ success: false, error: "無權限" }, { status: 403 });
  }
  await db.blog.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  // 留言
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const content = String(body.content ?? "").trim().slice(0, 500);
  if (!content) {
    return NextResponse.json({ success: false, error: "內容必填" }, { status: 400 });
  }
  const c = await db.blogComment.create({
    data: { blogId: params.id, authorId: session.user.id, content },
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
  });
  return NextResponse.json({ success: true, comment: c });
}
