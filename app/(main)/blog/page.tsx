import Link from "next/link";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "個人日誌 | JKForum" };

export default async function BlogListPage({
  searchParams,
}: {
  searchParams: { author?: string };
}) {
  const where = {
    isPublic: true,
    ...(searchParams.author ? { authorId: searchParams.author } : {}),
  };
  const blogs = await db.blog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profile: { select: { avatarUrl: true } },
        },
      },
    },
  });

  const owner = searchParams.author
    ? await db.user.findUnique({
        where: { id: searchParams.author },
        select: { displayName: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <BookOpen className="h-7 w-7 text-primary" />
            {owner ? `${owner.displayName} 的日誌` : "個人日誌"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            分享你的生活、心情、創作
          </p>
        </div>
        <Link href="/blog/new">
          <Button>
            <Plus className="mr-1 h-4 w-4" />
            寫日誌
          </Button>
        </Link>
      </header>

      <div className="grid gap-3">
        {blogs.length === 0 ? (
          <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            還沒有日誌，搶先寫第一篇吧！
          </p>
        ) : (
          blogs.map((b) => (
            <Link
              key={b.id}
              href={`/blog/${b.id}`}
              className="rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                {b.coverUrl && (
                  <div
                    className="h-20 w-28 flex-none rounded bg-cover bg-center"
                    style={{ backgroundImage: `url(${b.coverUrl})` }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold">{b.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {b.content.replace(/<[^>]*>/g, "").slice(0, 200)}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>@{b.author.username}</span>
                    <span>·</span>
                    <span>{formatDate(b.createdAt)}</span>
                    <span>·</span>
                    <span>{b.viewCount} 閱讀</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
