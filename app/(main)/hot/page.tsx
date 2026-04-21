import { db } from "@/lib/db";
import { PostList } from "@/components/post/post-list";
import { Flame } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "熱門文章",
  description: "JKForum 熱門討論，依讚數與回覆熱度排序",
};

async function getHotPosts() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return db.post.findMany({
    where: {
      status: "PUBLISHED",
      createdAt: { gte: sevenDaysAgo },
    },
    orderBy: [{ likeCount: "desc" }, { replyCount: "desc" }, { viewCount: "desc" }],
    take: 30,
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
  });
}

export default async function HotPage() {
  const rawPosts = await getHotPosts();
  const posts = rawPosts.map((p) => ({
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
        <Flame className="h-7 w-7 text-orange-500" />
        <div>
          <h1 className="text-2xl font-bold">熱門文章</h1>
          <p className="text-sm text-muted-foreground">過去 7 天討論度最高的文章</p>
        </div>
      </div>
      <PostList posts={posts} showSortTabs={false} showForum emptyMessage="尚無熱門文章" />
    </div>
  );
}
