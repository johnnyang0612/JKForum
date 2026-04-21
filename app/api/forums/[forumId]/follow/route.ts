import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  _: Request,
  { params }: { params: { forumId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const existing = await db.forumFollow.findUnique({
    where: {
      userId_forumId: { userId: session.user.id, forumId: params.forumId },
    },
  });

  if (existing) {
    await db.forumFollow.delete({
      where: {
        userId_forumId: { userId: session.user.id, forumId: params.forumId },
      },
    });
    return NextResponse.json({ following: false });
  }

  const forum = await db.forum.findUnique({
    where: { id: params.forumId },
    select: { id: true },
  });
  if (!forum) return NextResponse.json({ error: "看板不存在" }, { status: 404 });

  await db.forumFollow.create({
    data: { userId: session.user.id, forumId: params.forumId },
  });
  return NextResponse.json({ following: true });
}
