import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { PostCard } from "@/components/post/post-card";
import { Pagination } from "@/components/shared/pagination";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

interface Props {
  params: { userId: string };
  searchParams: { page?: string };
}

export const metadata: Metadata = { title: "收藏文章" };

export default async function UserFavoritesPage({ params, searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.id !== params.userId) {
    redirect(`/profile/${params.userId}`);
  }

  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 20;

  const [favorites, total] = await Promise.all([
    db.favorite.findMany({
      where: { userId: params.userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        post: {
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
        },
      },
    }),
    db.favorite.count({ where: { userId: params.userId } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">我的收藏</h2>
      {favorites.length > 0 ? (
        <div className="space-y-3">
          {favorites.map((fav) => (
            <PostCard
              key={fav.id}
              post={{
                ...fav.post,
                author: {
                  id: fav.post.author.id, username: fav.post.author.username,
                  displayName: fav.post.author.displayName,
                  avatarUrl: fav.post.author.profile?.avatarUrl,
                  level: fav.post.author.points?.level,
                },
                tags: fav.post.tags.map((t) => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })),
              }}
              showForum
            />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-muted-foreground">暫無收藏</p>
      )}
      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  );
}
