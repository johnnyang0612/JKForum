import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ success: false, error: "無權限" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  await db.couponCode.update({
    where: { id: params.id },
    data: { isActive: body.isActive ?? undefined },
  });
  return NextResponse.json({ success: true });
}
