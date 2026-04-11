import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { PostDetail } from "@/components/post/post-detail";
import { PostActions } from "@/components/post/post-actions";
import { ReplyList } from "@/components/reply/reply-list";
import { ReplyEditor } from "@/components/reply/reply-editor";
import { Pagination } from "@/components/shared/pagination";
import { PostInlineAds } from "@/components/ad/post-inline-ads";
import { SITE_CONFIG } from "@/lib/constants/config";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

interface Props {
  params: { postId: string };
  searchParams: { page?: string };
}

async function getPost(postId: string) {
  return db.post.findUnique({
    where: { id: postId },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profile: { select: { avatarUrl: true, signature: true } },
          points: { select: { level: true, totalPoints: true } },
        },
      },
      forum: {
        select: {
          id: true,
          name: true,
          slug: true,
          category: { select: { id: true, name: true, slug: true } },
        },
      },
      tags: { include: { tag: true } },
      attachments: true,
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.postId);
  if (!post) return { title: "文章不存在" };
  return {
    title: post.title,
    description: post.excerpt || undefined,
  };
}

export default async function PostPage({ params, searchParams }: Props) {
  const post = await getPost(params.postId);

  if (!post || post.status === "DELETED") {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;
  const isAuthenticated = !!session;

  // Increment view count (fire-and-forget)
  db.post.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  // Check if user has liked/favorited
  let isLiked = false;
  let isDisliked = false;
  let isFavorited = false;

  if (currentUserId) {
    const [like, favorite] = await Promise.all([
      db.like.findUnique({
        where: { userId_postId: { userId: currentUserId, postId: post.id } },
      }),
      db.favorite.findUnique({
        where: { userId_postId: { userId: currentUserId, postId: post.id } },
      }),
    ]);
    if (like) {
      isLiked = like.isLike;
      isDisliked = !like.isLike;
    }
    isFavorited = !!favorite;
  }

  // Get replies with pagination
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = SITE_CONFIG.repliesPerPage;

  const [topLevelReplies, totalReplies] = await Promise.all([
    db.reply.findMany({
      where: {
        postId: post.id,
        parentId: null,
        status: { not: "DELETED" },
      },
      orderBy: { floor: "asc" },
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
        children: {
          where: { status: { not: "DELETED" } },
          orderBy: { createdAt: "asc" },
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
          },
        },
      },
    }),
    db.reply.count({
      where: { postId: post.id, parentId: null, status: { not: "DELETED" } },
    }),
  ]);

  const totalPages = Math.ceil(totalReplies / limit);

  // Check likes for replies
  const replyIds = topLevelReplies.flatMap((r) => [
    r.id,
    ...r.children.map((c) => c.id),
  ]);

  let likedReplyIds: Set<string> = new Set();
  if (currentUserId && replyIds.length > 0) {
    const likes = await db.like.findMany({
      where: {
        userId: currentUserId,
        replyId: { in: replyIds },
        isLike: true,
      },
      select: { replyId: true },
    });
    likedReplyIds = new Set(likes.map((l) => l.replyId!));
  }

  const mappedReplies = topLevelReplies.map((reply) => ({
    ...reply,
    isLiked: likedReplyIds.has(reply.id),
    children: reply.children.map((child) => ({
      ...child,
      isLiked: likedReplyIds.has(child.id),
    })),
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PostDetail post={post} />

      <PostActions
        postId={post.id}
        likeCount={post.likeCount}
        dislikeCount={post.dislikeCount}
        favoriteCount={post.favoriteCount}
        isLiked={isLiked}
        isDisliked={isDisliked}
        isFavorited={isFavorited}
        isAuthenticated={isAuthenticated}
      />

      <ReplyList
        replies={mappedReplies}
        isAuthenticated={isAuthenticated}
        currentUserId={currentUserId}
      />

      {/* 文章內穿插廣告（回覆列表後方） */}
      <PostInlineAds forumId={post.forumId} />

      <Pagination currentPage={page} totalPages={totalPages} />

      {/* Reply editor */}
      {isAuthenticated && post.status !== "LOCKED" && (
        <ReplyEditor postId={post.id} />
      )}

      {!isAuthenticated && (
        <div className="rounded-lg border bg-muted/30 p-6 text-center">
          <p className="text-muted-foreground">
            請先{" "}
            <a href="/login" className="text-primary hover:underline font-medium">
              登入
            </a>{" "}
            後才能回覆
          </p>
        </div>
      )}
    </div>
  );
}
