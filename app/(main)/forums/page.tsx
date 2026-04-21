import { db } from "@/lib/db";
import { CategorySection } from "@/components/forum/category-section";
import { formatNumber } from "@/lib/utils/format";
import { MessageSquare, FileText, Users } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "看板列表",
};

async function getCategoriesWithForums() {
  return db.category.findMany({
    where: { isVisible: true, isEnabled: true },
    orderBy: { sortOrder: "asc" },
    include: {
      forums: {
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

async function getStats() {
  const [totalPosts, totalForums, totalUsers] = await Promise.all([
    db.post.count({ where: { status: "PUBLISHED" } }),
    db.forum.count({ where: { isVisible: true } }),
    db.user.count({ where: { status: "ACTIVE" } }),
  ]);
  return { totalPosts, totalForums, totalUsers };
}

export default async function ForumsPage() {
  const [categories, stats] = await Promise.all([
    getCategoriesWithForums(),
    getStats(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">看板列表</h1>
        <p className="mt-1 text-muted-foreground">瀏覽��有討論看板</p>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-6 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2 text-sm">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">看板數</span>
          <span className="font-bold">{formatNumber(stats.totalForums)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">總文章</span>
          <span className="font-bold">{formatNumber(stats.totalPosts)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">會員數</span>
          <span className="font-bold">{formatNumber(stats.totalUsers)}</span>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 ? (
        <div className="space-y-8">
          {categories.map((category) => (
            <CategorySection
              key={category.id}
              category={{
                ...category,
                forums: category.forums.map((f) => ({
                  ...f,
                  category: { slug: category.slug },
                })),
              }}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-muted-foreground">
          暫無看板
        </div>
      )}
    </div>
  );
}
