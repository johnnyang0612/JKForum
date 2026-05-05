import { db } from "@/lib/db";
import { PostListCard, type PostListCardPost } from "@/components/post/post-list-card";
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

function extractFirstImg(html: string | null | undefined): string | null {
  if (!html) return null;
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1] ?? null;
}

export default async function HotPage() {
  const rawPosts = await getHotPosts();
  const posts: PostListCardPost[] = rawPosts.map((p) => ({
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
    coverImageUrl: extractFirstImg(p.content),
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
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-center gap-3">
        <Flame className="h-6 w-6 text-orange-500 sm:h-7 sm:w-7" />
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">熱門文章</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">過去 7 天討論度最高的文章</p>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p>尚無熱門文章</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {posts.map((post) => (
            <PostListCard key={post.id} post={post} showForum />
          ))}
        </div>
      )}
    </div>
  );
}
