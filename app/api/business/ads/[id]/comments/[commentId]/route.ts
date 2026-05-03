import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: { id: string; commentId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });

  const c = await db.businessAdComment.findUnique({ where: { id: params.commentId } });
  if (!c) return NextResponse.json({ success: false, error: "找不到" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  if (c.userId !== session.user.id && !isAdmin) {
    return NextResponse.json({ success: false, error: "無權限" }, { status: 403 });
  }

  await db.businessAdComment.update({
    where: { id: params.commentId },
    data: { isDeleted: true, content: "" },
  });
  return NextResponse.json({ success: true });
}
