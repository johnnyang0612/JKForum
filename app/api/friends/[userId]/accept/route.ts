import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  _: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  // The other user must have sent the request to the current user
  const fr = await db.friendship.findUnique({
    where: {
      requesterId_addresseeId: {
        requesterId: params.userId,
        addresseeId: session.user.id,
      },
    },
  });
  if (!fr || fr.status !== "PENDING") {
    return NextResponse.json(
      { error: "找不到該好友請求" },
      { status: 404 }
    );
  }

  await db.friendship.update({
    where: { id: fr.id },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });
  return NextResponse.json({ status: "ACCEPTED" });
}
