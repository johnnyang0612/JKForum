import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/shared/pagination";
import { timeAgo } from "@/lib/utils/format";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: "文章管理" };

interface Props {
  searchParams: { page?: string; q?: string; status?: string };
}

export default async function AdminPostsPage({ searchParams }: Props) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 20;
  const query = searchParams.q?.trim();
  const statusFilter = searchParams.status;

  const where: Record<string, unknown> = {};
  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
    ];
  }
  if (statusFilter) {
    where.status = statusFilter;
  } else {
    where.status = { not: "DELETED" };
  }

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { displayName: true, username: true } },
        forum: { select: { name: true } },
      },
    }),
    db.post.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "success"> = {
    PUBLISHED: "success",
    DRAFT: "secondary",
    HIDDEN: "secondary",
    LOCKED: "default",
    DELETED: "destructive",
    PENDING: "default",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">文章管理</h1>

      <form className="flex gap-2" method="GET">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="搜尋文章標題..."
          className="flex-1 h-10 rounded-md border bg-background px-3 text-sm"
        />
        <select name="status" defaultValue={statusFilter || ""} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="">所有狀態</option>
          <option value="PUBLISHED">已發布</option>
          <option value="DRAFT">草稿</option>
          <option value="HIDDEN">隱藏</option>
          <option value="LOCKED">鎖定</option>
          <option value="DELETED">已刪除</option>
        </select>
        <button type="submit" className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-white">搜尋</button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left font-medium">標題</th>
              <th className="p-3 text-left font-medium">作者</th>
              <th className="p-3 text-left font-medium">看板</th>
              <th className="p-3 text-left font-medium">狀態</th>
              <th className="p-3 text-left font-medium">時間</th>
              <th className="p-3 text-left font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b hover:bg-muted/30">
                <td className="p-3 max-w-[200px]">
                  <p className="font-medium truncate">{post.title}</p>
                </td>
                <td className="p-3 text-muted-foreground text-xs">{post.author.displayName}</td>
                <td className="p-3 text-muted-foreground text-xs">{post.forum.name}</td>
                <td className="p-3">
                  <Badge variant={STATUS_COLORS[post.status] || "secondary"}>{post.status}</Badge>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{timeAgo(post.createdAt)}</td>
                <td className="p-3">
                  <Link href={`/posts/${post.id}`} className="text-primary hover:underline text-xs">
                    查看
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  );
}
