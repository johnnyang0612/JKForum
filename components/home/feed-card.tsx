import Link from "next/link";
import { Flame, Eye, MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";
import { formatNumber, timeAgo } from "@/lib/utils/format";

export interface FeedCardPost {
  id: string;
  title: string;
  excerpt?: string | null;
  createdAt: Date | string;
  viewCount: number;
  likeCount: number;
  replyCount: number;
  isPinned?: boolean;
  isFeatured?: boolean;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  forum?: {
    name: string;
    slug: string;
    categorySlug?: string;
  };
  coverImageUrl?: string | null;
  /** heat score (likes + replies*2 + views/10) */
  heat?: number;
}

interface FeedCardProps {
  post: FeedCardPost;
  className?: string;
}

function computeHeat(p: FeedCardPost): number {
  return (
    (p.heat ?? 0) ||
    p.likeCount * 1 +
      p.replyCount * 2 +
      Math.floor((p.viewCount || 0) / 10)
  );
}

export function FeedCard({ post, className }: FeedCardProps) {
  const heat = computeHeat(post);
  const forumHref = post.forum?.categorySlug
    ? `/forums/${post.forum.categorySlug}/${post.forum.slug}`
    : undefined;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg",
        className
      )}
    >
      <Link href={`/posts/${post.id}`} className="block">
        {/* Cover / gradient placeholder */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-primary/20 via-muted to-muted">
          {post.coverImageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={post.coverImageUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl text-muted-foreground/40">
              {post.title.charAt(0)}
            </div>
          )}

          {/* Heat badge */}
          {heat > 0 && (
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs font-bold text-white backdrop-blur">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              {formatNumber(heat)}
            </div>
          )}

          {post.isFeatured && (
            <span className="absolute right-2 top-2 rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-black shadow">
              精華
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4">
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2 sm:text-sm">
              {post.excerpt}
            </p>
          )}

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar
                src={post.author.avatarUrl}
                fallback={post.author.displayName}
                size="sm"
              />
              <span className="truncate">
                {post.forum?.name ?? post.author.displayName}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="flex items-center gap-0.5">
                <Eye className="h-3 w-3" />
                {formatNumber(post.viewCount)}
              </span>
              <span className="flex items-center gap-0.5">
                <MessageCircle className="h-3 w-3" />
                {formatNumber(post.replyCount)}
              </span>
            </div>
          </div>
          <div className="mt-1 text-xs text-muted-foreground/70">
            {timeAgo(post.createdAt)}
          </div>
        </div>
      </Link>

      {/* Forum tag (separate link — not nested in the main link) */}
      {forumHref && post.forum && (
        <Link
          href={forumHref}
          className="absolute bottom-3 right-3 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors opacity-0 group-hover:opacity-100"
        >
          {post.forum.name}
        </Link>
      )}
    </article>
  );
}
