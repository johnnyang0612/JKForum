import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { FeedCard, type FeedCardPost } from "@/components/home/feed-card";
import { Users, UserPlus, Hash } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "追蹤動態",
};

async function getFeed(userId: string): Promise<FeedCardPost[]> {
  const [followedUsers, followedForums] = await Promise.all([
    db.userFollow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    }),
    db.forumFollow.findMany({
      where: { userId },
      select: { forumId: true },
    }),
  ]);

  const userIds = followedUsers.map((f) => f.followingId);
  const forumIds = followedForums.map((f) => f.forumId);

  if (userIds.length === 0 && forumIds.length === 0) return [];

  const raw = await db.post.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        userIds.length > 0 ? { authorId: { in: userIds } } : undefined,
        forumIds.length > 0 ? { forumId: { in: forumIds } } : undefined,
      ].filter(Boolean) as object[],
    },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: {
      author: {
        select: {
          id: true,
          displayName: true,
          profile: { select: { avatarUrl: true } },
        },
      },
      forum: {
        select: {
          name: true,
          slug: true,
          category: { select: { slug: true } },
        },
      },
    },
  });

  const extractImg = (html: string | null): string | null => {
    if (!html) return null;
    const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return m?.[1] ?? null;
  };

  return raw.map((p) => ({
    id: p.id,
    title: p.title,
    excerpt: p.excerpt,
    createdAt: p.createdAt,
    viewCount: p.viewCount,
    likeCount: p.likeCount,
    replyCount: p.replyCount,
    isPinned: p.isPinned,
    isFeatured: p.isFeatured,
    coverImageUrl: extractImg(p.content),
    author: {
      id: p.author.id,
      displayName: p.author.displayName,
      avatarUrl: p.author.profile?.avatarUrl ?? null,
    },
    forum: p.forum
      ? {
          name: p.forum.name,
          slug: p.forum.slug,
          categorySlug: p.forum.category?.slug,
        }
      : undefined,
  }));
}

export default async function FollowFeedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [posts, userCount] = await Promise.all([
    getFeed(session.user.id),
    db.userFollow.count({ where: { followerId: session.user.id } }),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">追蹤動態</h1>
          <p className="text-sm text-muted-foreground">
            追蹤 {userCount} 位用戶
          </p>
        </div>
      </header>

      {posts.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center space-y-4">
          <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold">還沒有追蹤任何人或看板</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              去熱門看看，追蹤你喜歡的作者和版區，這裡就會顯示他們的動態
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              <Hash className="h-4 w-4" />
              逛店家總覽
            </Link>
            <Link
              href="/hot"
              className="inline-flex items-center gap-1.5 rounded-md border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              看熱門
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {posts.map((p) => (
            <FeedCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
