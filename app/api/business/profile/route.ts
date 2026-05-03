import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const merchantName = String(body.merchantName ?? "").trim();
  const merchantBio = String(body.merchantBio ?? "").trim();
  if (!merchantName) return NextResponse.json({ success: false, error: "商號必填" }, { status: 400 });

  await db.user.update({
    where: { id: session.user.id },
    data: { merchantName: merchantName.slice(0, 60), merchantBio: merchantBio.slice(0, 500) },
  });

  return NextResponse.json({ success: true });
}
