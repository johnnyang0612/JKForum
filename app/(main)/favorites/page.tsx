import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { PostList } from "@/components/post/post-list";
import { Bookmark } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "我的收藏",
};

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const favorites = await db.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      post: {
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profile: { select: { avatarUrl: true } },
              points: { select: { level: true } },
            },
          },
          forum: { select: { id: true, name: true, slug: true } },
          tags: { include: { tag: true } },
        },
      },
    },
  });

  const posts = favorites
    .filter((f) => f.post && f.post.status === "PUBLISHED")
    .map(({ post: p }) => ({
      id: p.id,
      title: p.title,
      excerpt: p.excerpt,
      slug: p.slug,
      createdAt: p.createdAt,
      viewCount: p.viewCount,
      likeCount: p.likeCount,
      replyCount: p.replyCount,
      isPinned: p.isPinned,
      isFeatured: p.isFeatured,
      visibility: p.visibility,
      author: {
        id: p.author.id,
        username: p.author.username,
        displayName: p.author.displayName,
        avatarUrl: p.author.profile?.avatarUrl ?? null,
        level: p.author.points?.level,
      },
      forum: p.forum
        ? { id: p.forum.id, name: p.forum.name, slug: p.forum.slug }
        : undefined,
      tags: p.tags.map((pt) => ({
        id: pt.tag.id,
        name: pt.tag.name,
        color: pt.tag.color,
      })),
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bookmark className="h-7 w-7 text-yellow-500" />
        <div>
          <h1 className="text-2xl font-bold">我的收藏</h1>
          <p className="text-sm text-muted-foreground">你收藏的所有文章</p>
        </div>
      </div>
      <PostList
        posts={posts}
        showSortTabs={false}
        showForum
        emptyMessage="你尚未收藏任何文章，可在文章頁面點擊收藏按鈕"
      />
    </div>
  );
}
