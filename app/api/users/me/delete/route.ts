import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const reason = body.reason ? String(body.reason).slice(0, 500) : null;

  const existing = await db.accountDeletionRequest.findUnique({
    where: { userId: session.user.id },
  });
  if (existing && !existing.cancelledAt && !existing.executedAt) {
    return NextResponse.json({ error: "已有未完成的刪除申請" }, { status: 400 });
  }

  const scheduledAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);

  if (existing) {
    await db.accountDeletionRequest.update({
      where: { userId: session.user.id },
      data: { reason, scheduledAt, cancelledAt: null, executedAt: null },
    });
  } else {
    await db.accountDeletionRequest.create({
      data: { userId: session.user.id, reason, scheduledAt },
    });
  }

  return NextResponse.json({ ok: true, scheduledAt: scheduledAt.toISOString() });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  await db.accountDeletionRequest.updateMany({
    where: { userId: session.user.id, executedAt: null, cancelledAt: null },
    data: { cancelledAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
