import { cache } from "react";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ForumHeader } from "@/components/forum/forum-header";
import { PostCard } from "@/components/post/post-card";
import { PostSortTabs } from "@/components/post/post-sort-tabs";
import { Pagination } from "@/components/shared/pagination";
import { SITE_CONFIG } from "@/lib/constants/config";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

interface Props {
  params: { categorySlug: string; forumSlug: string };
  searchParams: { page?: string; sort?: string };
}

const getForum = cache(async (slug: string) => {
  return db.forum.findUnique({
    where: { slug },
    include: {
      category: true,
      moderators: {
        include: {
          user: {
            select: { id: true, username: true, displayName: true },
          },
        },
      },
    },
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const forum = await getForum(params.forumSlug);
  if (!forum) return { title: "看板不存在" };
  return {
    title: forum.name,
    description: forum.description || `${forum.name} - 討論看板`,
  };
}

export default async function ForumPage({ params, searchParams }: Props) {
  const forum = await getForum(params.forumSlug);

  if (!forum || !forum.isVisible) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const isFollowing = session?.user?.id
    ? !!(await db.forumFollow.findUnique({
        where: {
          userId_forumId: { userId: session.user.id, forumId: forum.id },
        },
        select: { id: true },
      }))
    : false;
  const page = Math.max(1, Number(searchParams.page) || 1);
  const sort = searchParams.sort || "latest";
  const limit = SITE_CONFIG.postsPerPage;

  // Build order clause
  let orderBy: Record<string, string> = {};
  switch (sort) {
    case "popular":
      orderBy = { likeCount: "desc" };
      break;
    case "featured":
      orderBy = { featuredAt: "desc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  // Get pinned posts (always show at top)
  const pinnedPosts = await db.post.findMany({
    where: {
      forumId: forum.id,
      status: "PUBLISHED",
      isPinned: true,
    },
    orderBy: { pinnedAt: "desc" },
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
      tags: { include: { tag: true } },
    },
  });

  // Get regular posts with pagination
  const whereClause = {
    forumId: forum.id,
    status: "PUBLISHED" as const,
    isPinned: false,
    ...(sort === "featured" ? { isFeatured: true } : {}),
  };

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where: whereClause,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
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
        tags: { include: { tag: true } },
      },
    }),
    db.post.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(total / limit);

  function mapPost(post: (typeof posts)[number]) {
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
      tags: post.tags.map((t) => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })),
    };
  }

  return (
    <div className="space-y-6">
      <ForumHeader
        forum={{
          ...forum,
          category: forum.category,
          moderators: forum.moderators,
        }}
        isAuthenticated={!!session}
        isFollowing={isFollowing}
      />

      <PostSortTabs />

      {/* Pinned posts */}
      {pinnedPosts.length > 0 && page === 1 && (
        <div className="space-y-3">
          {pinnedPosts.map((post) => (
            <PostCard key={post.id} post={mapPost(post)} />
          ))}
        </div>
      )}

      {/* Regular posts */}
      {posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={mapPost(post)} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-muted-foreground">
          {sort === "featured" ? "暫無精華文章" : "暫無文章"}
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  );
}
