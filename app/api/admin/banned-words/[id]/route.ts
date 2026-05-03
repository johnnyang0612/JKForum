import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { invalidateModerationCache } from "@/lib/content-moderation";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ success: false, error: "無權限" }, { status: 403 });
  }
  await db.bannedWord.delete({ where: { id: Number(params.id) } });
  invalidateModerationCache();
  return NextResponse.json({ success: true });
}
