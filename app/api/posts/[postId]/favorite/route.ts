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

  const existing = await db.favorite.findUnique({
    where: { userId_postId: { userId: session.user.id, postId: params.postId } },
  });

  if (existing) {
    return NextResponse.json({ success: false, error: "已收藏" }, { status: 400 });
  }

  await db.favorite.create({
    data: { userId: session.user.id, postId: params.postId },
  });
  await db.post.update({
    where: { id: params.postId },
    data: { favoriteCount: { increment: 1 } },
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

  const existing = await db.favorite.findUnique({
    where: { userId_postId: { userId: session.user.id, postId: params.postId } },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "尚未收藏" }, { status: 400 });
  }

  await db.favorite.delete({ where: { id: existing.id } });
  await db.post.update({
    where: { id: params.postId },
    data: { favoriteCount: { decrement: 1 } },
  });

  return NextResponse.json({ success: true });
}
