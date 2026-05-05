import Link from "next/link";
import { Eye, ThumbsUp, MessageCircle, Pin, Star, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { formatNumber, timeAgo } from "@/lib/utils/format";
import { getLevelByIndex } from "@/lib/constants/levels";

export interface PostListCardPost {
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
  /** 文章首張內嵌圖（從 content HTML 抽取） */
  coverImageUrl?: string | null;
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
}

interface Props {
  post: PostListCardPost;
  showForum?: boolean;
  className?: string;
}

/**
 * 依 post id/title 產生穩定的漸層作為 placeholder
 * — 沒有 cover 圖時使用
 */
function deterministicGradient(seed: string): string {
  let h1 = 0;
  for (let i = 0; i < seed.length; i++) {
    h1 = (h1 * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const hue1 = h1 % 360;
  const hue2 = (hue1 + 60) % 360;
  return `linear-gradient(135deg, hsl(${hue1} 70% 55%), hsl(${hue2} 70% 45%))`;
}

/**
 * 日誌風卡片 — 左圖右文，meta 在底
 * 用於 /hot、/latest 列表頁
 */
export function PostListCard({ post, showForum = false, className }: Props) {
  const level =
    post.author.level != null ? getLevelByIndex(post.author.level) : null;
  const heat =
    post.likeCount +
    post.replyCount * 2 +
    Math.floor((post.viewCount || 0) / 10);
  const isHot = heat >= 30;

  const cover = post.coverImageUrl;
  const placeholderStyle = cover
    ? undefined
    : {
        backgroundImage: deterministicGradient(post.id || post.title),
      };

  return (
    <Link
      href={`/posts/${post.id}`}
      className={cn(
        "group block rounded-xl border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-4",
        post.isPinned && "border-primary/40 bg-primary/5",
        className
      )}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Cover thumbnail */}
        <div
          className="relative flex h-20 w-28 flex-none items-center justify-center overflow-hidden rounded-lg bg-cover bg-center text-white sm:h-24 sm:w-36 md:h-28 md:w-44"
          style={
            cover
              ? { backgroundImage: `url(${cover})` }
              : placeholderStyle
          }
        >
          {!cover && (
            <span className="text-2xl font-bold text-white/80 drop-shadow sm:text-3xl">
              {post.title.charAt(0)}
            </span>
          )}
          {post.isFeatured && (
            <span className="absolute left-1.5 top-1.5 rounded-full bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold text-black shadow">
              精華
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Title row */}
          <div className="flex items-start gap-1.5">
            {post.isPinned && (
              <Pin className="mt-1 h-4 w-4 shrink-0 text-primary" />
            )}
            {post.isFeatured && !post.isPinned && (
              <Star className="mt-1 h-4 w-4 shrink-0 fill-yellow-500 text-yellow-500" />
            )}
            {isHot && !post.isPinned && !post.isFeatured && (
              <span className="mt-0.5 inline-flex shrink-0 items-center gap-0.5 rounded-full bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-bold text-orange-500">
                <Flame className="h-3 w-3" />
                {formatNumber(heat)}
              </span>
            )}
            <h2 className="line-clamp-2 text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-lg">
              {post.title}
            </h2>
          </div>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground sm:mt-1.5">
              {post.excerpt}
            </p>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {post.tags.slice(0, 3).map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">
              @{post.author.username}
            </span>
            {level && (
              <span
                className="rounded px-1 text-[10px] font-bold"
                style={{ color: level.color }}
              >
                {level.name}
              </span>
            )}
            {showForum && post.forum && (
              <span className="text-muted-foreground/80">
                {post.forum.name}
              </span>
            )}
            <span>·</span>
            <span>{timeAgo(post.createdAt)}</span>
            <div className="ml-auto flex items-center gap-3">
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
        </div>
      </div>
    </Link>
  );
}
