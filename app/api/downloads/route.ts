/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const featured = url.searchParams.get("featured") === "1";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const limit = 24;

  const where: any = { isActive: true };
  if (category) where.category = category;
  if (featured) where.isFeatured = true;

  const [items, total] = await Promise.all([
    db.downloadResource.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { downloadCount: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.downloadResource.count({ where }),
  ]);

  return NextResponse.json({ success: true, items, total, page, limit });
}
