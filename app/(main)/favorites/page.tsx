/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { PostList } from "@/components/post/post-list";
import { AdCard } from "@/components/listing/ad-card";
import { Bookmark } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "我的收藏" };

export default async function FavoritesPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const tab = searchParams.tab === "stores" ? "stores" : "posts";

  const [favorites, storeFavorites, storeCount, postCount] = await Promise.all([
    tab === "posts"
      ? db.favorite.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          take: 50,
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
        })
      : Promise.resolve([] as any[]),
    tab === "stores"
      ? db.businessAdFavorite.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          take: 60,
        })
      : Promise.resolve([] as any[]),
    db.businessAdFavorite.count({ where: { userId: session.user.id } }),
    db.favorite.count({ where: { userId: session.user.id } }),
  ]);

  const ads = storeFavorites.length
    ? await db.businessAd.findMany({
        where: { id: { in: storeFavorites.map((f: any) => f.adId) } },
      })
    : [];
  const forumIds = Array.from(new Set(ads.map((a) => a.forumId)));
  const forums = forumIds.length
    ? await db.forum.findMany({ where: { id: { in: forumIds } }, select: { id: true, name: true } })
    : [];
  const forumMap = new Map(forums.map((f) => [f.id, f]));

  const posts = favorites
    .filter((f: any) => f.post && f.post.status === "PUBLISHED")
    .map(({ post: p }: any) => ({
      id: p.id, title: p.title, excerpt: p.excerpt, slug: p.slug,
      createdAt: p.createdAt, viewCount: p.viewCount, likeCount: p.likeCount,
      replyCount: p.replyCount, isPinned: p.isPinned, isFeatured: p.isFeatured,
      visibility: p.visibility,
      author: {
        id: p.author.id, username: p.author.username, displayName: p.author.displayName,
        avatarUrl: p.author.profile?.avatarUrl ?? null,
        level: p.author.points?.level,
      },
      forum: p.forum ? { id: p.forum.id, name: p.forum.name, slug: p.forum.slug } : undefined,
      tags: p.tags.map((pt: any) => ({ id: pt.tag.id, name: pt.tag.name, color: pt.tag.color })),
    }));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Bookmark className="h-7 w-7 text-yellow-500" />
        <div>
          <h1 className="text-2xl font-bold">我的收藏</h1>
          <p className="text-sm text-muted-foreground">文章 + 店家廣告</p>
        </div>
      </div>

      <div className="flex gap-1 border-b">
        <Link href="?tab=posts"
          className={`border-b-2 px-3 py-1.5 text-sm transition ${
            tab === "posts" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}>
          📄 文章 ({postCount})
        </Link>
        <Link href="?tab=stores"
          className={`border-b-2 px-3 py-1.5 text-sm transition ${
            tab === "stores" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}>
          🏪 店家 ({storeCount})
        </Link>
      </div>

      {tab === "posts" ? (
        <PostList posts={posts} showSortTabs={false} showForum emptyMessage="尚未收藏任何文章" />
      ) : ads.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          尚未收藏任何店家
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {ads.map((a) => (
            <AdCard key={a.id} ad={{
              id: a.id, title: a.title, city: a.city, district: a.district,
              coverImageUrl: a.coverImageUrl, tier: a.tier,
              priceMin: a.priceMin, priceMax: a.priceMax,
              ratingAvg: a.ratingAvg, ratingCount: a.ratingCount,
              viewCount: a.viewCount, favoriteCount: a.favoriteCount,
              tags: (a.tags as string[]) ?? [],
              forumName: forumMap.get(a.forumId)?.name ?? "",
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
