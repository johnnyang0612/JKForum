import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  await db.businessAd.update({
    where: { id: params.id },
    data: { contactCount: { increment: 1 } },
  }).catch(() => null);
  return NextResponse.json({ success: true });
}
