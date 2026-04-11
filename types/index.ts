import type {
  User,
  UserProfile,
  UserPoints,
  Post,
  Reply,
  Forum,
  Category,
  Subforum,
  Tag,
  Notification,
  Like,
  Favorite,
} from "@prisma/client";

// ============================================================
// 用戶相關
// ============================================================

export type UserWithProfile = User & {
  profile: UserProfile | null;
  points: UserPoints | null;
};

export type UserCardData = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  levelName: string;
  levelColor: string;
  role: string;
};

export type UserProfileData = UserWithProfile & {
  _count?: {
    posts: number;
    replies: number;
    followers: number;
    following: number;
  };
};

// ============================================================
// 文章相關
// ============================================================

export type PostWithAuthor = Post & {
  author: {
    id: string;
    username: string;
    displayName: string;
    profile: { avatarUrl: string | null } | null;
    points: { level: number } | null;
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
  tags: Array<{
    tag: Tag;
  }>;
};

export type PostListItem = {
  id: string;
  title: string;
  excerpt: string | null;
  slug: string;
  createdAt: Date;
  viewCount: number;
  likeCount: number;
  replyCount: number;
  isPinned: boolean;
  isFeatured: boolean;
  visibility: string;
  author: UserCardData;
  forum: {
    id: string;
    name: string;
    slug: string;
  };
  tags: Array<{ id: string; name: string; slug: string; color: string | null }>;
};

export type PostDetailData = PostWithAuthor & {
  isLiked?: boolean;
  isFavorited?: boolean;
  _count?: {
    replies: number;
    likes: number;
    favorites: number;
  };
};

// ============================================================
// 回覆相關
// ============================================================

export type ReplyWithAuthor = Reply & {
  author: {
    id: string;
    username: string;
    displayName: string;
    profile: { avatarUrl: string | null } | null;
    points: { level: number } | null;
  };
  children?: ReplyWithAuthor[];
  isLiked?: boolean;
};

// ============================================================
// 看板相關
// ============================================================

export type CategoryWithForums = Category & {
  forums: ForumListItem[];
};

export type ForumListItem = Forum & {
  _count?: {
    posts: number;
  };
  subforums?: Subforum[];
};

export type ForumDetailData = Forum & {
  category: Category;
  subforums: Subforum[];
  moderators: Array<{
    user: {
      id: string;
      username: string;
      displayName: string;
      profile: { avatarUrl: string | null } | null;
    };
  }>;
  _count: {
    posts: number;
  };
};

// ============================================================
// 通知相關
// ============================================================

export type NotificationData = Notification & {
  isNew?: boolean;
};

// ============================================================
// 排序選項
// ============================================================

export type PostSortOption = "latest" | "popular" | "featured" | "active";
export type ReplySortOption = "oldest" | "newest" | "popular";

// ============================================================
// 搜尋相關
// ============================================================

export type SearchType = "post" | "user" | "forum";

export type SearchResult = {
  type: SearchType;
  id: string;
  title: string;
  excerpt?: string;
  url: string;
  createdAt?: Date;
};
