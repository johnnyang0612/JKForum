/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// 給 blog 編輯器搜尋業者廣告（綁定用）
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const city = url.searchParams.get("city")?.trim() ?? "";
  const where: any = { status: { in: ["ACTIVE", "EXPIRED"] } };
  if (city) where.city = city;
  if (q) where.OR = [
    { title: { contains: q, mode: "insensitive" } },
    { description: { contains: q, mode: "insensitive" } },
  ];

  const list = await db.businessAd.findMany({
    where,
    orderBy: [{ tier: "desc" }, { sortWeight: "desc" }],
    take: 20,
    select: {
      id: true, title: true, city: true, district: true,
      coverImageUrl: true, ratingAvg: true, ratingCount: true,
    },
  });
  return NextResponse.json({ success: true, list });
}
