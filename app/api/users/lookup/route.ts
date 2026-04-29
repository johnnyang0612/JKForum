import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ success: false, error: "缺少 q" }, { status: 400 });
  }
  const u = await db.user.findFirst({
    where: {
      OR: [
        { id: q },
        { username: q },
        { email: q },
      ],
    },
    select: { id: true, username: true, displayName: true, email: true },
  });
  return NextResponse.json({ success: true, user: u });
}
