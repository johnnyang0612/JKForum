import Link from "next/link";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import { TagManager } from "@/components/admin/tag-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "標籤管理" };

export default async function AdminTagsPage({
  searchParams,
}: { searchParams: { q?: string; sort?: string } }) {
  const q = searchParams.q?.trim();
  const sort = searchParams.sort === "name" ? "name" : "postCount";

  const where: Record<string, unknown> = {};
  if (q) where.name = { contains: q, mode: "insensitive" };

  const tags = await db.tag.findMany({
    where,
    orderBy: sort === "name" ? { name: "asc" } : { postCount: "desc" },
    take: 200,
  });

  const total = await db.tag.count();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">🏷️ 標籤管理</h1>
        <p className="text-sm text-muted-foreground mt-1">
          全站文章標籤共 {total.toLocaleString()} 個。可合併重複/錯字、刪除冷門。
        </p>
      </div>

      <form className="flex gap-2 text-sm">
        <input name="q" defaultValue={q ?? ""} placeholder="搜尋標籤名稱…"
          className="flex-1 rounded border bg-background px-3 py-2" />
        <select name="sort" defaultValue={sort}
          className="rounded border bg-background px-2 py-2">
          <option value="postCount">熱度排序</option>
          <option value="name">名稱排序</option>
        </select>
        <button type="submit" className="rounded bg-primary px-3 py-2 text-primary-foreground">搜尋</button>
      </form>

      <TagManager tags={tags.map((t) => ({
        id: t.id, name: t.name, slug: t.slug, postCount: t.postCount,
        color: t.color, createdAt: t.createdAt.toISOString(),
      }))} />

      <p className="text-xs text-muted-foreground">
        顯示前 200 個。<Link href="/admin/tags?sort=name" className="text-primary hover:underline">改名稱排序</Link>
      </p>
    </div>
  );
}
