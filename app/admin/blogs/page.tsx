import Link from "next/link";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "日誌管理" };

export default async function AdminBlogsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 30;
  const q = searchParams.q?.trim();

  const where: Record<string, unknown> = {};
  if (q) where.OR = [
    { title: { contains: q, mode: "insensitive" } },
    { content: { contains: q, mode: "insensitive" } },
  ];
  if (searchParams.status) where.status = searchParams.status;

  const [blogs, total] = await Promise.all([
    db.blog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, displayName: true, username: true } },
        _count: { select: { comments: true } },
      },
    }),
    db.blog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">📔 日誌管理</h1>
        <p className="text-sm text-muted-foreground mt-1">{total.toLocaleString()} 篇日誌</p>
      </div>

      <form className="flex gap-2 text-sm">
        <input name="q" defaultValue={q ?? ""} placeholder="搜尋標題或內容…"
          className="flex-1 rounded border bg-background px-3 py-2" />
        <select name="status" defaultValue={searchParams.status ?? ""}
          className="rounded border bg-background px-2 py-2">
          <option value="">全部</option>
          <option value="DRAFT">草稿</option>
          <option value="PUBLISHED">已發布</option>
          <option value="ARCHIVED">已下架</option>
        </select>
        <button type="submit" className="rounded bg-primary px-3 py-2 text-primary-foreground">搜尋</button>
      </form>

      <div className="md:overflow-x-auto md:rounded-lg md:border">
        <table className="responsive-table w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-2 text-left">時間</th>
              <th className="p-2 text-left">作者</th>
              <th className="p-2 text-left">標題</th>
              <th className="p-2 text-right">瀏覽 / 讚 / 留言</th>
              <th className="p-2 text-left">狀態</th>
              <th className="p-2 w-24">操作</th>
            </tr>
          </thead>
          <tbody>
            {blogs.map((b) => (
              <tr key={b.id} className="border-b hover:bg-muted/20">
                <td data-label="時間" className="p-2 whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(b.createdAt).toLocaleDateString("zh-TW")}
                </td>
                <td data-label="作者" className="p-2">
                  <Link href={`/admin/users/${b.author.id}`} className="text-primary hover:underline">
                    {b.author.displayName}
                  </Link>
                </td>
                <td data-label="標題" className="p-2 max-w-[300px] truncate">
                  <Link href={`/blog/${b.id}`} className="hover:underline" title={b.title}>
                    {b.title}
                  </Link>
                </td>
                <td data-label="統計" className="p-2 text-right text-xs text-muted-foreground">
                  {b.viewCount} / {b.likeCount} / {b._count.comments}
                </td>
                <td data-label="狀態" className="p-2 text-xs">
                  <span className={`rounded px-1.5 py-0.5 ${
                    b.status === "PUBLISHED" ? "bg-success/10 text-success" : "bg-muted"
                  }`}>{b.status}</span>
                </td>
                <td data-label="操作" className="p-2">
                  <form action={`/api/admin/blogs/${b.id}/delete`} method="POST">
                    <button type="submit"
                      className="rounded border border-destructive/40 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                      onClick={(e) => { if (!confirm(`刪除「${b.title}」？`)) e.preventDefault(); }}>
                      刪除
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {blogs.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">無資料</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          {page > 1 && (
            <Link href={`?${new URLSearchParams({ ...searchParams, page: String(page - 1) }).toString()}`}
              className="rounded border px-3 py-1 hover:bg-muted">上一頁</Link>
          )}
          <span className="px-3 py-1">{page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={`?${new URLSearchParams({ ...searchParams, page: String(page + 1) }).toString()}`}
              className="rounded border px-3 py-1 hover:bg-muted">下一頁</Link>
          )}
        </div>
      )}
    </div>
  );
}
