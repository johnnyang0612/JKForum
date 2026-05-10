import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// 登出所有裝置：bump sessionVersion → 讓所有 JWT 失效
// （NextAuth 用 JWT 策略，無 server session 表可刪；用 sessionVersion 比對）
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  await db.user.update({
    where: { id: session.user.id },
    data: { sessionVersion: { increment: 1 } },
  });

  return NextResponse.json({ ok: true });
}
