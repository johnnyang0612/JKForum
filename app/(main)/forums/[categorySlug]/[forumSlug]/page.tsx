import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkR18Access } from "@/lib/age-gate";
import { ForumHeader } from "@/components/forum/forum-header";
import { PostCard } from "@/components/post/post-card";
import { PostSortTabs } from "@/components/post/post-sort-tabs";
import { ForumAdStrip } from "@/components/listing/forum-ad-strip";
import { Pagination } from "@/components/shared/pagination";
import { SITE_CONFIG } from "@/lib/constants/config";
import { AdvancedFilterPanel } from "@/components/listing/advanced-filter-panel";
import {
  buildPostAdvancedWhere,
  parseAdvancedFilterParams,
  safeParseFilterDefs,
} from "@/lib/advanced-filters";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

interface Props {
  params: { categorySlug: string; forumSlug: string };
  searchParams: Record<string, string | string[] | undefined>;
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

  // R-18 gate
  if (forum.rating === "R18" || forum.ageGateEnabled) {
    const access = await checkR18Access(session?.user?.id);
    if (access.reason === "disabled") notFound();
    if (access.reason === "need_gate") {
      redirect(
        `/age-gate?next=/forums/${params.categorySlug}/${params.forumSlug}`
      );
    }
  }
  const isFollowing = session?.user?.id
    ? !!(await db.forumFollow.findUnique({
        where: {
          userId_forumId: { userId: session.user.id, forumId: forum.id },
        },
        select: { id: true },
      }))
    : false;

  // 站長 (ADMIN/SUPER_ADMIN) 或本版版主可以置頂
  const role = session?.user?.role;
  const isStaff = role === "ADMIN" || role === "SUPER_ADMIN";
  const canModerate = !!session?.user?.id && (
    isStaff ||
    !!(await db.forumModerator.findUnique({
      where: { forumId_userId: { forumId: forum.id, userId: session.user.id } },
      select: { id: true },
    }))
  );
  const pageRaw = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  const sortRaw = Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort;
  const page = Math.max(1, Number(pageRaw) || 1);
  const sort = sortRaw || "latest";
  const limit = SITE_CONFIG.postsPerPage;

  // 進階搜尋（per-forum）
  const filterDefs = safeParseFilterDefs(forum.advancedFiltersJson);
  const parsedAdv = parseAdvancedFilterParams(searchParams, filterDefs);
  const advWhere = buildPostAdvancedWhere(parsedAdv);

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

  // Get pinned posts (always show at top, capped at forum.maxPinnedPosts)
  const pinnedPosts = await db.post.findMany({
    where: {
      forumId: forum.id,
      status: "PUBLISHED",
      isPinned: true,
    },
    orderBy: { pinnedAt: "desc" },
    take: forum.maxPinnedPosts ?? 2,
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
    ...(advWhere.length ? { AND: advWhere } : {}),
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

      {/* PRD-0503: 業者廣告置頂橫幅（僅啟用 paid listing 的版區） */}
      {forum.allowPaidListing && page === 1 && (
        <ForumAdStrip forumId={forum.id} />
      )}

      <PostSortTabs />

      {/* 進階搜尋（per-forum）*/}
      {filterDefs.length > 0 && (
        <AdvancedFilterPanel
          filterDefsRaw={forum.advancedFiltersJson}
          initialOpen={Object.keys(parsedAdv).length > 0}
          scope="forum"
        />
      )}

      {/* Pinned posts */}
      {pinnedPosts.length > 0 && page === 1 && (
        <div className="space-y-3">
          {pinnedPosts.map((post) => (
            <PostCard key={post.id} post={mapPost(post)} canModerate={canModerate} />
          ))}
        </div>
      )}

      {/* Regular posts */}
      {posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={mapPost(post)} canModerate={canModerate} />
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
