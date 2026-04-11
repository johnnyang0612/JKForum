import type { Metadata } from "next";
import { db } from "@/lib/db";
import { AdForm } from "../ad-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "新增廣告" };

export default async function NewAdPage() {
  // 取得看板列表供目標選擇
  const forums = await db.forum.findMany({
    where: { isVisible: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">新增廣告</h1>
      <AdForm forums={forums} />
    </div>
  );
}
