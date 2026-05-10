import Link from "next/link";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ForumBatchTable } from "@/components/admin/forum-batch-table";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "看板管理" };

export default async function AdminForumsPage() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      forums: { orderBy: { sortOrder: "asc" } },
    },
  });

  const data = categories.map((c) => ({
    id: c.id,
    name: c.name,
    forums: c.forums.map((f) => ({
      id: f.id,
      name: f.name,
      slug: f.slug,
      postCount: f.postCount,
      todayPostCount: f.todayPostCount,
      isVisible: f.isVisible,
      isLocked: f.isLocked,
      categoryName: c.name,
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">看板管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            點「顯示/隱藏/鎖定」徽章可直接切換；勾選複選框可批量操作。
          </p>
        </div>
        <Link href="/admin/forums/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            新增看板
          </Button>
        </Link>
      </div>

      <ForumBatchTable categories={data} />
    </div>
  );
}
