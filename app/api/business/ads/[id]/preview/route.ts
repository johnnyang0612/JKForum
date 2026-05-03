import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const ad = await db.businessAd.findUnique({
    where: { id: params.id },
    select: {
      id: true, title: true, city: true, district: true,
      coverImageUrl: true, ratingAvg: true, ratingCount: true,
    },
  });
  if (!ad) return NextResponse.json({ success: false, error: "找不到" }, { status: 404 });
  return NextResponse.json({ success: true, ad });
}
