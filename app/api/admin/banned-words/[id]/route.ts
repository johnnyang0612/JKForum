import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { invalidateModerationCache } from "@/lib/content-moderation";
import { logAdminAction } from "@/lib/admin-log";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ success: false, error: "無權限" }, { status: 403 });
  }
  const w = await db.bannedWord.findUnique({ where: { id: Number(params.id) } });
  await db.bannedWord.delete({ where: { id: Number(params.id) } });
  invalidateModerationCache();
  await logAdminAction({
    adminId: session.user.id, action: "BANNED_WORD_REMOVE",
    targetType: "BannedWord", targetId: params.id,
    detail: w?.word ?? "",
  });
  return NextResponse.json({ success: true });
}
