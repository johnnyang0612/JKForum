import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { invalidateModerationCache } from "@/lib/content-moderation";
import { logAdminAction } from "@/lib/admin-log";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ success: false, error: "無權限" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const word = String(body.word ?? "").trim().slice(0, 50);
  const severity = body.severity === "FLAG" ? "FLAG" : "BLOCK";
  const category = body.category ? String(body.category).slice(0, 30) : null;
  if (!word) return NextResponse.json({ success: false, error: "詞必填" }, { status: 400 });

  try {
    const banned = await db.bannedWord.create({
      data: { word, severity, category, createdBy: session.user.id },
    });
    invalidateModerationCache();
    await logAdminAction({
      adminId: session.user.id, action: "BANNED_WORD_ADD",
      targetType: "BannedWord", targetId: String(banned.id),
      detail: `${severity} ${word}`,
    });
    return NextResponse.json({ success: true, banned });
  } catch {
    return NextResponse.json({ success: false, error: "詞已存在" }, { status: 400 });
  }
}
