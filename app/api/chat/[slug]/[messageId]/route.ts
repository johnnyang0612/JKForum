import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string; messageId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const msg = await db.chatMessage.findUnique({ where: { id: params.messageId } });
  if (!msg) {
    return NextResponse.json({ success: false, error: "訊息不存在" }, { status: 404 });
  }
  const isOwner = msg.senderId === session.user.id;
  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  const isAdmin = me?.role === "ADMIN" || me?.role === "SUPER_ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ success: false, error: "無權限" }, { status: 403 });
  }
  await db.chatMessage.update({
    where: { id: params.messageId },
    data: { isDeleted: true },
  });
  return NextResponse.json({ success: true });
}
