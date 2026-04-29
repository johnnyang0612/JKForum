import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const url = String(body.coverPhotoUrl ?? "").trim();
  if (url && !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ success: false, error: "需 http(s) URL" }, { status: 400 });
  }
  await db.user.update({
    where: { id: session.user.id },
    data: { coverPhotoUrl: url || null },
  });
  return NextResponse.json({ success: true, coverPhotoUrl: url || null });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  await db.user.update({
    where: { id: session.user.id },
    data: { coverPhotoUrl: null },
  });
  return NextResponse.json({ success: true });
}
