import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: "看板管理" };

export default async function AdminForumsPage() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      forums: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">看板管理</h1>
        <Link href="/admin/forums/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            新增看板
          </Button>
        </Link>
      </div>

      {categories.map((category) => (
        <div key={category.id} className="space-y-3">
          <h2 className="text-lg font-semibold">{category.name}</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">看板名稱</th>
                  <th className="p-3 text-left font-medium">代稱</th>
                  <th className="p-3 text-left font-medium">文章數</th>
                  <th className="p-3 text-left font-medium">今日</th>
                  <th className="p-3 text-left font-medium">狀態</th>
                  <th className="p-3 text-left font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {category.forums.map((forum) => (
                  <tr key={forum.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{forum.name}</td>
                    <td className="p-3 text-muted-foreground">{forum.slug}</td>
                    <td className="p-3">{formatNumber(forum.postCount)}</td>
                    <td className="p-3 text-success">+{forum.todayPostCount}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {forum.isVisible ? (
                          <Badge variant="success">顯示</Badge>
                        ) : (
                          <Badge variant="secondary">隱藏</Badge>
                        )}
                        {forum.isLocked && <Badge variant="destructive">鎖定</Badge>}
                      </div>
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/admin/forums/${forum.id}`}
                        className="text-primary hover:underline text-xs"
                      >
                        編輯
                      </Link>
                    </td>
                  </tr>
                ))}
                {category.forums.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      此分類下暫無看板
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
