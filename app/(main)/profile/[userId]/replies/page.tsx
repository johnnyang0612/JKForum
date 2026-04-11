import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Pagination } from "@/components/shared/pagination";
import { timeAgo } from "@/lib/utils/format";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

interface Props {
  params: { userId: string };
  searchParams: { page?: string };
}

export const metadata: Metadata = { title: "用戶回覆" };

export default async function UserRepliesPage({ params, searchParams }: Props) {
  const user = await db.user.findUnique({
    where: { id: params.userId },
    select: { id: true, displayName: true },
  });

  if (!user) notFound();

  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 20;

  const [replies, total] = await Promise.all([
    db.reply.findMany({
      where: { authorId: user.id, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        post: { select: { id: true, title: true } },
      },
    }),
    db.reply.count({ where: { authorId: user.id, status: "PUBLISHED" } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">{user.displayName} 的回覆</h2>
      {replies.length > 0 ? (
        <div className="space-y-3">
          {replies.map((reply) => (
            <div key={reply.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span>回覆於</span>
                <Link
                  href={`/posts/${reply.post.id}`}
                  className="font-medium text-primary hover:underline truncate"
                >
                  {reply.post.title}
                </Link>
                <span className="shrink-0">{timeAgo(reply.createdAt)}</span>
              </div>
              <div
                className="prose prose-sm dark:prose-invert max-w-none line-clamp-3"
                dangerouslySetInnerHTML={{ __html: reply.content }}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-muted-foreground">暫無回覆</p>
      )}
      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  );
}
