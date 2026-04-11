import { PostCard } from "./post-card";
import { PostSortTabs } from "./post-sort-tabs";

interface PostListProps {
  posts: Array<{
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
  }>;
  showSortTabs?: boolean;
  showForum?: boolean;
  emptyMessage?: string;
}

export function PostList({
  posts,
  showSortTabs = true,
  showForum = false,
  emptyMessage = "暫無文章",
}: PostListProps) {
  return (
    <div className="space-y-4">
      {showSortTabs && (
        <div className="flex items-center justify-between">
          <PostSortTabs />
        </div>
      )}

      {posts.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              showForum={showForum}
            />
          ))}
        </div>
      )}
    </div>
  );
}
