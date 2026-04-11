import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }

  const existing = await db.like.findUnique({
    where: { userId_postId: { userId: session.user.id, postId: params.postId } },
  });

  if (existing) {
    return NextResponse.json({ success: false, error: "已經按讚" }, { status: 400 });
  }

  await db.like.create({
    data: { userId: session.user.id, postId: params.postId, isLike: true },
  });
  await db.post.update({
    where: { id: params.postId },
    data: { likeCount: { increment: 1 } },
  });

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

  const existing = await db.like.findUnique({
    where: { userId_postId: { userId: session.user.id, postId: params.postId } },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "尚未按讚" }, { status: 400 });
  }

  await db.like.delete({ where: { id: existing.id } });
  await db.post.update({
    where: { id: params.postId },
    data: existing.isLike ? { likeCount: { decrement: 1 } } : { dislikeCount: { decrement: 1 } },
  });

  return NextResponse.json({ success: true });
}
