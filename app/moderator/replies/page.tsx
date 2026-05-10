import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/utils/format";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "版內留言" };

export default async function ModeratorRepliesPage({
  searchParams,
}: { searchParams: { page?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  let myForumIds: string[];
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
  const limit = 50;

  const [replies, total] = await Promise.all([
    db.reply.findMany({
      where: { post: { forumId: { in: myForumIds } }, status: { not: "DELETED" } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, displayName: true } },
        post: { select: { id: true, title: true, forumId: true } },
      },
    }),
    db.reply.count({
      where: { post: { forumId: { in: myForumIds } }, status: { not: "DELETED" } },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div>
        <Link href="/moderator" className="text-xs text-muted-foreground hover:text-primary">← 版務後台</Link>
        <h1 className="mt-1 text-2xl font-bold">版內留言</h1>
        <p className="text-sm text-muted-foreground">{total.toLocaleString()} 則</p>
      </div>

      <div className="space-y-2">
        {replies.map((r) => (
          <div key={r.id} className="rounded-lg border bg-card p-3 text-sm">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{r.author.displayName} · {timeAgo(r.createdAt)}</span>
              <Link href={`/posts/${r.post.id}#reply-${r.id}`} className="text-primary hover:underline">查看</Link>
            </div>
            <p className="mt-1 line-clamp-2">{r.content.replace(/<[^>]+>/g, "")}</p>
            <p className="mt-1 text-xs text-muted-foreground">回應於：{r.post.title}</p>
          </div>
        ))}
        {replies.length === 0 && (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            無留言
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          {page > 1 && <Link href={`?page=${page - 1}`} className="rounded border px-3 py-1">上一頁</Link>}
          <span className="px-3 py-1">{page} / {totalPages}</span>
          {page < totalPages && <Link href={`?page=${page + 1}`} className="rounded border px-3 py-1">下一頁</Link>}
        </div>
      )}
    </div>
  );
}
