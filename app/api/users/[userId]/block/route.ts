import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  if (session.user.id === params.userId) {
    return NextResponse.json({ error: "不能封鎖自己" }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id: params.userId }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "使用者不存在" }, { status: 404 });

  await db.userBlock.upsert({
    where: { blockerId_blockedId: { blockerId: session.user.id, blockedId: params.userId } },
    update: {},
    create: { blockerId: session.user.id, blockedId: params.userId },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  await db.userBlock.deleteMany({
    where: { blockerId: session.user.id, blockedId: params.userId },
  });

  return NextResponse.json({ ok: true });
}
