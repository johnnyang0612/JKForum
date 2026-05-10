import Link from "next/link";
import { Eye, ThumbsUp, MessageCircle, Pin, Star, Flame } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { formatNumber, timeAgo } from "@/lib/utils/format";
import { getLevelByIndex } from "@/lib/constants/levels";
import { PostPinButton } from "@/components/post/post-pin-button";
import { PostAuthorActions } from "@/components/post/post-author-actions";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    excerpt: string | null;
    slug: string;
    createdAt: Date | string;
    viewCount: number;
    likeCount: number;
    replyCount: number;
    isPinned: boolean;
    isFeatured: boolean;
    visibility: string;
    author: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string | null;
      level?: number;
    };
    forum?: {
      id: string;
      name: string;
      slug: string;
    };
    tags?: Array<{ id: string; name: string; color: string | null }>;
  };
  showForum?: boolean;
  className?: string;
  /** 顯示置頂/取消置頂按鈕（站長或本版版主） */
  canModerate?: boolean;
  /** 顯示作者自己的編輯/刪除按鈕 */
  showAuthorActions?: boolean;
}

export function PostCard({ post, showForum = false, className, canModerate = false, showAuthorActions = false }: PostCardProps) {
  const level = post.author.level != null ? getLevelByIndex(post.author.level) : null;
  const heat =
    post.likeCount +
    post.replyCount * 2 +
    Math.floor((post.viewCount || 0) / 10);
  const isHot = heat >= 30;

  return (
    <article
      className={cn(
        "group rounded-lg border bg-card p-4 transition-colors hover:border-primary/30",
        post.isPinned && "border-primary/40 bg-primary/5",
        className
      )}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <Link href={`/profile/${post.author.id}`} className="shrink-0">
          <Avatar
            src={post.author.avatarUrl}
            fallback={post.author.displayName}
            size="md"
          />
        </Link>

        <div className="min-w-0 flex-1">
          {/* Title line */}
          <div className="flex items-start gap-2">
            {post.isPinned && (
              <Pin className="mt-1 h-4 w-4 shrink-0 text-primary" />
            )}
            {post.isFeatured && (
              <Star className="mt-1 h-4 w-4 shrink-0 text-yellow-500 fill-yellow-500" />
            )}
            {isHot && !post.isPinned && !post.isFeatured && (
              <span className="mt-0.5 inline-flex items-center gap-0.5 shrink-0 rounded-full bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-bold text-orange-500">
                <Flame className="h-3 w-3" />
                {formatNumber(heat)}
              </span>
            )}
            <Link
              href={`/posts/${post.id}`}
              className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1"
            >
              {post.title}
            </Link>
          </div>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {post.excerpt}
            </p>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {post.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <Link
              href={`/profile/${post.author.id}`}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <span className="font-medium">{post.author.displayName}</span>
              {level && (
                <span
                  className="rounded px-1 text-[10px] font-bold"
                  style={{ color: level.color }}
                >
                  {level.name}
                </span>
              )}
            </Link>
            {showForum && post.forum && (
              <Link
                href={`/forums/${post.forum.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {post.forum.name}
              </Link>
            )}
            <span>{timeAgo(post.createdAt)}</span>
            <div className="flex items-center gap-3 ml-auto">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {formatNumber(post.viewCount)}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />
                {formatNumber(post.likeCount)}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {formatNumber(post.replyCount)}
              </span>
            </div>
          </div>

          {/* Visibility badge */}
          {post.visibility !== "PUBLIC" && (
            <div className="mt-1">
              <PostVisibilityBadge visibility={post.visibility} />
            </div>
          )}

          {/* Mod actions */}
          {canModerate && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <PostPinButton postId={post.id} isPinned={post.isPinned} />
            </div>
          )}

          {/* Author actions */}
          {showAuthorActions && (
            <div className="mt-2">
              <PostAuthorActions postId={post.id} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function PostVisibilityBadge({ visibility }: { visibility: string }) {
  const labels: Record<string, { text: string; variant: "default" | "secondary" | "destructive" }> = {
    REPLY_TO_VIEW: { text: "回覆可見", variant: "secondary" },
    PAID: { text: "付費", variant: "default" },
    VIP_ONLY: { text: "VIP 限定", variant: "default" },
    PRIVATE: { text: "私密", variant: "destructive" },
  };

  const config = labels[visibility];
  if (!config) return null;

  return <Badge variant={config.variant} className="text-xs">{config.text}</Badge>;
}
