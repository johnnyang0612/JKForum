import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { PostList } from "@/components/post/post-list";
import { FileText } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "我的文章",
};

export default async function MyPostsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const rawPosts = await db.post.findMany({
    where: { authorId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
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
        <FileText className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">我的文章</h1>
          <p className="text-sm text-muted-foreground">你發表過的所有文章（含草稿）</p>
        </div>
      </div>
      <PostList
        posts={posts}
        showSortTabs={false}
        showForum
        showAuthorActions
        emptyMessage="你還沒發表過文章，點擊「發文」開始創作"
      />
    </div>
  );
}
