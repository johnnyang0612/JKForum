import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  const post = await db.post.findUnique({
    where: { id: params.postId },
    include: {
      author: {
        select: {
          id: true, username: true, displayName: true,
          profile: { select: { avatarUrl: true, signature: true } },
          points: { select: { level: true, totalPoints: true } },
        },
      },
      forum: {
        select: { id: true, name: true, slug: true, category: { select: { id: true, name: true, slug: true } } },
      },
      tags: { include: { tag: true } },
      attachments: true,
    },
  });

  if (!post || post.status === "DELETED") {
    return NextResponse.json({ success: false, error: "文章不存在" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: post });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }

  const post = await db.post.findUnique({
    where: { id: params.postId },
    select: { authorId: true },
  });

  if (!post) {
    return NextResponse.json({ success: false, error: "文章不存在" }, { status: 404 });
  }

  if (post.authorId !== session.user.id && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, error: "沒有權限" }, { status: 403 });
  }

  const body = await req.json();
  const updateData: Record<string, unknown> = {};
  if (body.title) updateData.title = body.title;
  if (body.content) updateData.content = body.content;
  if (body.visibility) updateData.visibility = body.visibility;

  await db.post.update({ where: { id: params.postId }, data: updateData });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }

  const post = await db.post.findUnique({
    where: { id: params.postId },
    select: { authorId: true },
  });

  if (!post) {
    return NextResponse.json({ success: false, error: "文章不存在" }, { status: 404 });
  }

  if (post.authorId !== session.user.id && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, error: "沒有權限" }, { status: 403 });
  }

  await db.post.update({ where: { id: params.postId }, data: { status: "DELETED" } });

  return NextResponse.json({ success: true });
}
