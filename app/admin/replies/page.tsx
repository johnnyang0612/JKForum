import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils/format";
import type { Metadata } from "next";
import { ReplyDeleteButton } from "@/components/admin/reply-delete-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "回覆管理" };

interface Props {
  searchParams: { page?: string; q?: string; status?: string };
}

export default async function AdminRepliesPage({ searchParams }: Props) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 30;
  const query = searchParams.q?.trim();
  const status = searchParams.status;

  const where: Record<string, unknown> = {};
  if (query) where.content = { contains: query, mode: "insensitive" };
  if (status) where.status = status;
  else where.status = { not: "DELETED" };

  const [replies, total] = await Promise.all([
    db.reply.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, displayName: true, username: true } },
        post: { select: { id: true, title: true, slug: true } },
      },
    }),
    db.reply.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">回覆管理</h1>
        <p className="text-sm text-muted-foreground">{total.toLocaleString()} 筆</p>
      </div>

      <form className="flex gap-2 text-sm">
        <input
          name="q"
          defaultValue={query ?? ""}
          placeholder="搜尋留言內容…"
          className="flex-1 rounded border bg-background px-3 py-2"
        />
        <select name="status" defaultValue={status ?? ""}
          className="rounded border bg-background px-2 py-2">
          <option value="">全部狀態</option>
          <option value="PUBLISHED">已發布</option>
          <option value="HIDDEN">已隱藏</option>
        </select>
        <button type="submit" className="rounded bg-primary px-3 py-2 text-primary-foreground">搜尋</button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-2 text-left">時間</th>
              <th className="p-2 text-left">作者</th>
              <th className="p-2 text-left">所屬文章</th>
              <th className="p-2 text-left">內容</th>
              <th className="p-2 text-left">狀態</th>
              <th className="p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {replies.map((r) => (
              <tr key={r.id} className="border-b hover:bg-muted/20">
                <td className="p-2 whitespace-nowrap text-xs text-muted-foreground">{timeAgo(r.createdAt)}</td>
                <td className="p-2">
                  <Link href={`/admin/users/${r.author.id}`} className="text-primary hover:underline">
                    {r.author.displayName}
                  </Link>
                </td>
                <td className="p-2 max-w-[200px] truncate">
                  <Link href={`/posts/${r.post.id}`} className="hover:underline" title={r.post.title}>
                    {r.post.title}
                  </Link>
                </td>
                <td className="p-2 max-w-[300px] truncate text-muted-foreground" title={r.content}>
                  {r.content.slice(0, 100)}
                </td>
                <td className="p-2">
                  <Badge variant={r.status === "PUBLISHED" ? "success" : "secondary"}>{r.status}</Badge>
                </td>
                <td className="p-2 text-center">
                  <ReplyDeleteButton replyId={r.id} />
                </td>
              </tr>
            ))}
            {replies.length === 0 && (
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
