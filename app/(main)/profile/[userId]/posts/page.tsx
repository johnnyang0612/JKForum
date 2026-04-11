import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PostCard } from "@/components/post/post-card";
import { Pagination } from "@/components/shared/pagination";
import { SITE_CONFIG } from "@/lib/constants/config";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

interface Props {
  params: { userId: string };
  searchParams: { page?: string };
}

export const metadata: Metadata = { title: "用戶文章" };

export default async function UserPostsPage({ params, searchParams }: Props) {
  const user = await db.user.findUnique({
    where: { id: params.userId },
    select: { id: true, displayName: true },
  });

  if (!user) notFound();

  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = SITE_CONFIG.postsPerPage;

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where: { authorId: user.id, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: {
          select: {
            id: true, username: true, displayName: true,
            profile: { select: { avatarUrl: true } },
            points: { select: { level: true } },
          },
        },
        forum: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: true } },
      },
    }),
    db.post.count({ where: { authorId: user.id, status: "PUBLISHED" } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">{user.displayName} 的文章</h2>
      {posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={{
                ...post,
                author: {
                  id: post.author.id, username: post.author.username,
                  displayName: post.author.displayName,
                  avatarUrl: post.author.profile?.avatarUrl,
                  level: post.author.points?.level,
                },
                tags: post.tags.map((t) => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })),
              }}
              showForum
            />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-muted-foreground">暫無文章</p>
      )}
      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  );
}
