import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils/format";
import { BlogCommentForm } from "@/components/blog/blog-comment-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  const b = await db.blog.findUnique({ where: { id: params.id }, select: { title: true } });
  return { title: b ? `${b.title} | 個人日誌` : "日誌" };
}

export default async function BlogDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const blog = await db.blog.findUnique({
    where: { id: params.id },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profile: { select: { avatarUrl: true } },
        },
      },
      comments: {
        orderBy: { createdAt: "asc" },
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
      },
    },
  });
  if (!blog || !blog.isPublic) notFound();

  // 計入 view（下次 deploy 加 dedup）
  await db.blog.update({ where: { id: params.id }, data: { viewCount: { increment: 1 } } });

  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary">
        ← 所有日誌
      </Link>

      {blog.coverUrl && (
        <div
          className="h-56 rounded-xl bg-cover bg-center sm:h-72"
          style={{ backgroundImage: `url(${blog.coverUrl})` }}
        />
      )}

      <header>
        <h1 className="text-3xl font-bold">{blog.title}</h1>
        <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
          <Link href={`/profile/${blog.author.id}`} className="hover:text-primary">
            @{blog.author.username}
          </Link>
          <span>·</span>
          <span>{formatDate(blog.createdAt)}</span>
          <span>·</span>
          <span>{blog.viewCount} 閱讀</span>
        </div>
      </header>

      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />

      <section className="space-y-3 border-t pt-5">
        <h2 className="text-lg font-bold">留言（{blog.comments.length}）</h2>
        <BlogCommentForm blogId={blog.id} />
        <ul className="space-y-2">
          {blog.comments.map((c) => (
            <li key={c.id} className="rounded-lg border bg-card p-3">
              <div className="flex items-baseline gap-2 text-sm">
                <Link href={`/profile/${c.author.id}`} className="font-medium hover:text-primary">
                  {c.author.displayName}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {formatDate(c.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-sm">{c.content}</p>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
