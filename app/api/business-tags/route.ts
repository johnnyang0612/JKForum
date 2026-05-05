/**
 * 公開：取得業者刊登標籤字典
 * 用於業者刊登表單載入可選標籤
 *
 * GET /api/business-tags
 *  → { success: true, tags: [{ id, name, slug, category, sortOrder, isUnlimited }, ...] }
 *
 * 只回傳 isActive=true 的標籤；以 sortOrder 排序（"不限" 永遠最前）。
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
// CDN 短暫快取 — 改動後最多 60 秒生效
export const revalidate = 60;

export async function GET() {
  const tags = await db.businessAdTag.findMany({
    where: { isActive: true },
    orderBy: [
      { isUnlimited: "desc" }, // 不限永遠最前
      { sortOrder: "asc" },
      { name: "asc" },
    ],
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      sortOrder: true,
      isUnlimited: true,
    },
  });

  return NextResponse.json(
    { success: true, tags },
    { headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } },
  );
}
