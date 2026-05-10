import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/utils/format";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "版內文章" };

export default async function ModeratorPostsPage({
  searchParams,
}: { searchParams: { forumId?: string; status?: string; page?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  // 找這個用戶能管的版
  let myForumIds: string[] = [];
  if (isAdmin) {
    const fs = await db.forum.findMany({ select: { id: true } });
    myForumIds = fs.map((f) => f.id);
  } else {
    const mods = await db.forumModerator.findMany({
      where: { userId: session.user.id }, select: { forumId: true },
    });
    myForumIds = mods.map((m) => m.forumId);
    if (myForumIds.length === 0) redirect("/moderator");
  }

  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 30;

  const where: Record<string, unknown> = {
    forumId: searchParams.forumId
      ? { equals: searchParams.forumId }
      : { in: myForumIds },
  };
  if (searchParams.status) where.status = searchParams.status;
  else where.status = { not: "DELETED" };

  // 限制 forumId 必須在我管的版內
  if (searchParams.forumId && !myForumIds.includes(searchParams.forumId)) {
    redirect("/moderator/posts");
  }

  const [posts, total, forums] = await Promise.all([
    db.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, displayName: true } },
        forum: { select: { id: true, name: true, slug: true, category: { select: { slug: true } } } },
      },
    }),
    db.post.count({ where }),
    db.forum.findMany({
      where: { id: { in: myForumIds } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div>
        <Link href="/moderator" className="text-xs text-muted-foreground hover:text-primary">← 版務後台</Link>
        <h1 className="mt-1 text-2xl font-bold">版內文章</h1>
        <p className="text-sm text-muted-foreground">{total.toLocaleString()} 篇</p>
      </div>

      <form className="flex flex-wrap gap-2 text-sm">
        <select name="forumId" defaultValue={searchParams.forumId ?? ""}
          className="rounded border bg-background px-3 py-2">
          <option value="">所有我管的版</option>
          {forums.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <select name="status" defaultValue={searchParams.status ?? ""}
          className="rounded border bg-background px-3 py-2">
          <option value="">全部狀態</option>
          <option value="PUBLISHED">已發布</option>
          <option value="DRAFT">草稿</option>
          <option value="HIDDEN">已隱藏</option>
          <option value="LOCKED">已鎖定</option>
        </select>
        <button type="submit" className="rounded bg-primary px-3 py-2 text-primary-foreground">套用</button>
      </form>

      <div className="md:overflow-x-auto md:rounded-lg md:border">
        <table className="responsive-table w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-2 text-left">時間</th>
              <th className="p-2 text-left">版區</th>
              <th className="p-2 text-left">作者</th>
              <th className="p-2 text-left">標題</th>
              <th className="p-2 text-left">狀態</th>
              <th className="p-2 w-32">操作</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b hover:bg-muted/20">
                <td data-label="時間" className="p-2 whitespace-nowrap text-xs text-muted-foreground">
                  {timeAgo(p.createdAt)}
                </td>
                <td data-label="版區" className="p-2 text-xs">{p.forum?.name ?? "—"}</td>
                <td data-label="作者" className="p-2">{p.author.displayName}</td>
                <td data-label="標題" className="p-2 max-w-[300px] truncate">
                  <Link href={`/posts/${p.id}`} className="text-primary hover:underline" title={p.title}>
                    {p.title}
                  </Link>
                  {p.isPinned && <span className="ml-2 rounded bg-amber-500/20 px-1 py-0.5 text-[10px] text-amber-400">📌 置頂</span>}
                  {p.isFeatured && <span className="ml-1 rounded bg-fuchsia-500/20 px-1 py-0.5 text-[10px] text-fuchsia-400">✨ 精華</span>}
                </td>
                <td data-label="狀態" className="p-2 text-xs">{p.status}</td>
                <td data-label="操作" className="p-2">
                  <div className="flex flex-wrap gap-1">
                    <form action={`/api/moderator/posts/${p.id}/pin`} method="POST">
                      <button type="submit"
                        className="rounded border px-2 py-1.5 text-[10px] hover:bg-muted">
                        {p.isPinned ? "取消置頂" : "📌 置頂"}
                      </button>
                    </form>
                    <form action={`/api/moderator/posts/${p.id}/feature`} method="POST">
                      <button type="submit"
                        className="rounded border px-2 py-1.5 text-[10px] hover:bg-muted">
                        {p.isFeatured ? "取消精華" : "✨ 精華"}
                      </button>
                    </form>
                    <form action={`/api/moderator/posts/${p.id}/lock`} method="POST">
                      <button type="submit"
                        className="rounded border px-2 py-1.5 text-[10px] hover:bg-muted">
                        {p.status === "LOCKED" ? "🔓 解鎖" : "🔒 鎖定"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">無文章</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          {page > 1 && (
            <Link href={`?${new URLSearchParams({ ...searchParams, page: String(page - 1) }).toString()}`}
              className="rounded border px-3 py-1">上一頁</Link>
          )}
          <span className="px-3 py-1">{page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={`?${new URLSearchParams({ ...searchParams, page: String(page + 1) }).toString()}`}
              className="rounded border px-3 py-1">下一頁</Link>
          )}
        </div>
      )}
    </div>
  );
}
