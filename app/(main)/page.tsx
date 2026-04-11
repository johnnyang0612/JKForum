import Link from "next/link";
import { ArrowRight, TrendingUp, Calendar, Megaphone, MessageSquare } from "lucide-react";
import { db } from "@/lib/db";
import { PostCard } from "@/components/post/post-card";
import { Button } from "@/components/ui/button";

import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "JKForum - 綜合型社群論壇平台",
};

async function getLatestPosts() {
  return db.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 10,
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
      forum: {
        select: {
          id: true,
          name: true,
          slug: true,
          category: { select: { slug: true } },
        },
      },
      tags: { include: { tag: true } },
    },
  });
}

async function getPopularPosts() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  return db.post.findMany({
    where: {
      status: "PUBLISHED",
      createdAt: { gte: weekAgo },
    },
    orderBy: { likeCount: "desc" },
    take: 10,
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
      forum: {
        select: {
          id: true,
          name: true,
          slug: true,
          category: { select: { slug: true } },
        },
      },
      tags: { include: { tag: true } },
    },
  });
}

async function getActiveForums() {
  return db.forum.findMany({
    where: { isVisible: true },
    orderBy: { todayPostCount: "desc" },
    take: 5,
    include: {
      category: { select: { slug: true } },
    },
  });
}

function mapPost(post: Awaited<ReturnType<typeof getLatestPosts>>[number]) {
  return {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    slug: post.slug,
    createdAt: post.createdAt,
    viewCount: post.viewCount,
    likeCount: post.likeCount,
    replyCount: post.replyCount,
    isPinned: post.isPinned,
    isFeatured: post.isFeatured,
    visibility: post.visibility,
    author: {
      id: post.author.id,
      username: post.author.username,
      displayName: post.author.displayName,
      avatarUrl: post.author.profile?.avatarUrl,
      level: post.author.points?.level,
    },
    forum: {
      id: post.forum.id,
      name: post.forum.name,
      slug: post.forum.slug,
    },
    tags: post.tags.map((t) => ({
      id: t.tag.id,
      name: t.tag.name,
      color: t.tag.color,
    })),
  };
}

export default async function HomePage() {
  const [latestPosts, popularPosts, activeForums] = await Promise.all([
    getLatestPosts(),
    getPopularPosts(),
    getActiveForums(),
  ]);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      {/* Main content */}
      <div className="space-y-8">
        {/* Hero */}
        <section className="rounded-xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            歡迎來到 JKForum
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            綜合型社群論壇平台 - 在這裡分享你的想法、討論有趣的話題、結交志同道合的朋友。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/forums">
              <Button>
                瀏覽看板
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/posts/new">
              <Button variant="outline">發表文章</Button>
            </Link>
          </div>
        </section>

        {/* Latest Posts */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">最新文章</h2>
            <Link
              href="/search?sort=latest"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              查看更多 <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {latestPosts.length > 0 ? (
              latestPosts.map((post) => (
                <PostCard key={post.id} post={mapPost(post)} showForum />
              ))
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                暫無文章，快來發表第一篇吧！
              </p>
            )}
          </div>
        </section>

        {/* Popular Posts */}
        {popularPosts.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">熱門文章</h2>
              <span className="text-sm text-muted-foreground">本週</span>
            </div>
            <div className="space-y-3">
              {popularPosts.map((post) => (
                <PostCard key={post.id} post={mapPost(post)} showForum />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sidebar */}
      <aside className="space-y-6">
        {/* Checkin reminder */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">每日簽到</h3>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            每天簽到即可獲得金幣獎��，連續簽到還有額外加成！
          </p>
          <Link href="/checkin" className="mt-3 block">
            <Button size="sm" className="w-full">
              前往簽到
            </Button>
          </Link>
        </div>

        {/* Active Forums */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">活躍看板</h3>
          </div>
          {activeForums.length > 0 ? (
            <div className="space-y-2">
              {activeForums.map((forum) => (
                <Link
                  key={forum.id}
                  href={`/forums/${forum.category.slug}/${forum.slug}`}
                  className="flex items-center justify-between rounded-md p-2 text-sm hover:bg-muted transition-colors"
                >
                  <span className="font-medium truncate">{forum.name}</span>
                  <span className="shrink-0 text-xs text-success">
                    +{forum.todayPostCount} 今日
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">暫無活躍看板</p>
          )}
        </div>

        {/* Announcements placeholder */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">站務公告</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            歡迎使用 JKForum！本站正在建設中，敬請期待更多功能。
          </p>
        </div>
      </aside>
    </div>
  );
}
