import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_TARGET = ["POST", "REPLY", "USER"] as const;
const VALID_TYPE = ["PORNOGRAPHY", "VIOLENCE", "SPAM", "HARASSMENT", "MISINFORMATION", "OTHER"] as const;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const targetType = body.targetType;
  const targetId = String(body.targetId ?? "");
  const type = body.type;
  const reason = String(body.reason ?? "").trim().slice(0, 500);
  const evidence = body.evidence ? String(body.evidence).slice(0, 1000) : null;

  if (!(VALID_TARGET as readonly string[]).includes(targetType)) {
    return NextResponse.json({ error: "targetType 不正確" }, { status: 400 });
  }
  if (!(VALID_TYPE as readonly string[]).includes(type)) {
    return NextResponse.json({ error: "違規類型不正確" }, { status: 400 });
  }
  if (!targetId) return NextResponse.json({ error: "targetId 必填" }, { status: 400 });
  if (!reason) return NextResponse.json({ error: "原因必填" }, { status: 400 });

  // 防止重複檢舉同一目標
  const dup = await db.report.findFirst({
    where: { reporterId: session.user.id, targetType, targetId, status: "PENDING" },
  });
  if (dup) return NextResponse.json({ error: "你已檢舉此項目，請耐心等待處理" }, { status: 400 });

  // 驗證 target 真實存在
  if (targetType === "POST") {
    const p = await db.post.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!p) return NextResponse.json({ error: "貼文不存在" }, { status: 404 });
  } else if (targetType === "REPLY") {
    const r = await db.reply.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!r) return NextResponse.json({ error: "回覆不存在" }, { status: 404 });
  } else if (targetType === "USER") {
    const u = await db.user.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!u) return NextResponse.json({ error: "使用者不存在" }, { status: 404 });
  }

  await db.report.create({
    data: {
      reporterId: session.user.id,
      targetType, targetId, type, reason, evidence,
    },
  });

  return NextResponse.json({ ok: true });
}

// 列我自己的檢舉紀錄
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const reports = await db.report.findMany({
    where: { reporterId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ reports });
}
