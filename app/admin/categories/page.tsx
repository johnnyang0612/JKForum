import { db } from "@/lib/db";
import type { Metadata } from "next";
import { CategoryManager } from "@/components/admin/category-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "分類管理" };

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { forums: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">分類管理</h1>
        <p className="text-sm text-muted-foreground mt-1">
          看板的上層分類。可調整排序、顯示/隱藏、內容分級。同分類下看板共享上層 navigation。
        </p>
      </div>
      <CategoryManager initial={categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        iconEmoji: c.iconEmoji,
        rating: c.rating,
        isVisible: c.isVisible,
        isEnabled: c.isEnabled,
        sortOrder: c.sortOrder,
        forumCount: c._count.forums,
      }))} />
    </div>
  );
}
