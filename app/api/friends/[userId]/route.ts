import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Send friend request (or auto-accept if reverse request exists).
 */
export async function POST(
  _: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }
  if (session.user.id === params.userId) {
    return NextResponse.json({ error: "不能加自己" }, { status: 400 });
  }

  const target = await db.user.findUnique({
    where: { id: params.userId },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: "用戶不存在" }, { status: 404 });

  // Check for reverse pending request
  const reverse = await db.friendship.findUnique({
    where: {
      requesterId_addresseeId: {
        requesterId: params.userId,
        addresseeId: session.user.id,
      },
    },
  });
  if (reverse) {
    if (reverse.status === "PENDING") {
      const updated = await db.friendship.update({
        where: { id: reverse.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });
      return NextResponse.json({ status: updated.status, accepted: true });
    }
    return NextResponse.json({ status: reverse.status });
  }

  // Check existing forward request
  const forward = await db.friendship.findUnique({
    where: {
      requesterId_addresseeId: {
        requesterId: session.user.id,
        addresseeId: params.userId,
      },
    },
  });
  if (forward) {
    return NextResponse.json({ status: forward.status });
  }

  const fr = await db.friendship.create({
    data: {
      requesterId: session.user.id,
      addresseeId: params.userId,
      status: "PENDING",
    },
  });
  return NextResponse.json({ status: fr.status });
}

/**
 * Cancel request / remove friend / reject (any current relation is deleted).
 */
export async function DELETE(
  _: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const result = await db.friendship.deleteMany({
    where: {
      OR: [
        { requesterId: session.user.id, addresseeId: params.userId },
        { requesterId: params.userId, addresseeId: session.user.id },
      ],
    },
  });
  return NextResponse.json({ deleted: result.count });
}
