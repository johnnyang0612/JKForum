import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { PostMeta } from "./post-meta";
import { PostVisibilityBadge } from "./post-visibility-badge";
import { getLevelByIndex } from "@/lib/constants/levels";
import Link from "next/link";

interface PostDetailProps {
  post: {
    id: string;
    title: string;
    content: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    viewCount: number;
    likeCount: number;
    dislikeCount: number;
    replyCount: number;
    favoriteCount: number;
    isPinned: boolean;
    isFeatured: boolean;
    visibility: string;
    status: string;
    author: {
      id: string;
      username: string;
      displayName: string;
      profile?: { avatarUrl: string | null; signature?: string | null } | null;
      points?: { level: number; totalPoints: number } | null;
    };
    forum: {
      id: string;
      name: string;
      slug: string;
      category: {
        id: string;
        name: string;
        slug: string;
      };
    };
    tags?: Array<{ tag: { id: string; name: string; slug: string; color: string | null } }>;
    attachments?: Array<{ id: string; fileName: string; fileUrl: string; mimeType: string }>;
  };
}

export function PostDetail({ post }: PostDetailProps) {
  const level = post.author.points
    ? getLevelByIndex(post.author.points.level)
    : null;

  return (
    <article className="space-y-6">
      {/* Title */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {post.isPinned && <Badge variant="default">置頂</Badge>}
          {post.isFeatured && <Badge variant="success">精華</Badge>}
          <PostVisibilityBadge visibility={post.visibility} />
          {post.status === "LOCKED" && <Badge variant="destructive">已鎖定</Badge>}
        </div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {post.title}
        </h1>
        <PostMeta
          author={{ id: post.author.id, displayName: post.author.displayName }}
          createdAt={post.createdAt}
          viewCount={post.viewCount}
          forum={{
            name: post.forum.name,
            slug: post.forum.slug,
            category: post.forum.category,
          }}
        />
      </div>

      {/* Author card */}
      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
        <Link href={`/profile/${post.author.id}`}>
          <Avatar
            src={post.author.profile?.avatarUrl}
            fallback={post.author.displayName}
            size="lg"
          />
        </Link>
        <div>
          <Link
            href={`/profile/${post.author.id}`}
            className="font-semibold hover:text-primary transition-colors"
          >
            {post.author.displayName}
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>@{post.author.username}</span>
            {level && (
              <span
                className="rounded px-1.5 py-0.5 font-bold text-[10px]"
                style={{ color: level.color, backgroundColor: `${level.color}15` }}
              >
                {level.name}
              </span>
            )}
          </div>
          {post.author.profile?.signature && (
            <p className="mt-1 text-xs text-muted-foreground italic">
              {post.author.profile.signature}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className="prose prose-neutral dark:prose-invert max-w-none prose-p:leading-relaxed prose-li:leading-relaxed prose-headings:scroll-mt-20 lg:prose-lg"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Attachments */}
      {post.attachments && post.attachments.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">附件</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {post.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border p-2 text-sm hover:bg-muted transition-colors"
              >
                {attachment.mimeType.startsWith("image/") ? (
                  <img
                    src={attachment.fileUrl}
                    alt={attachment.fileName}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : null}
                <span className="truncate">{attachment.fileName}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.tags.map(({ tag }) => (
            <Link key={tag.id} href={`/search?q=${encodeURIComponent(tag.name)}&type=post`}>
              <Badge variant="secondary">#{tag.name}</Badge>
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
