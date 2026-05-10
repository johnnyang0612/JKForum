import { redirect } from "next/navigation";
import Link from "next/link";
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

const VALID_TABS = ["published", "draft", "all"] as const;
type Tab = (typeof VALID_TABS)[number];

export default async function MyPostsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const tab: Tab = (VALID_TABS as readonly string[]).includes(searchParams.tab ?? "")
    ? (searchParams.tab as Tab)
    : "all";

  const where: Record<string, unknown> = { authorId: session.user.id };
  if (tab === "published") where.status = "PUBLISHED";
  else if (tab === "draft") where.status = "DRAFT";
  else where.status = { not: "DELETED" };

  const rawPosts = await db.post.findMany({
    where,
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
    status: p.status,
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

  // 計算各 tab 數量
  const [allCount, publishedCount, draftCount] = await Promise.all([
    db.post.count({ where: { authorId: session.user.id, status: { not: "DELETED" } } }),
    db.post.count({ where: { authorId: session.user.id, status: "PUBLISHED" } }),
    db.post.count({ where: { authorId: session.user.id, status: "DRAFT" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">我的文章</h1>
          <p className="text-sm text-muted-foreground">你發表過的所有文章與草稿</p>
        </div>
      </div>

      <div className="flex gap-1 border-b">
        <TabLink href="/my-posts?tab=all" active={tab === "all"} label={`全部 (${allCount})`} />
        <TabLink href="/my-posts?tab=published" active={tab === "published"} label={`已發布 (${publishedCount})`} />
        <TabLink href="/my-posts?tab=draft" active={tab === "draft"} label={`草稿 (${draftCount})`} />
      </div>

      {tab === "draft" && draftCount === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          沒有草稿。發文時點「儲存草稿」按鈕，或關閉發文頁前系統會自動保存。
        </div>
      )}

      <PostList
        posts={posts}
        showSortTabs={false}
        showForum
        showAuthorActions
        emptyMessage={
          tab === "draft"
            ? "尚無草稿"
            : tab === "published"
            ? "你還沒發表過文章"
            : "你還沒發表過文章，點擊「發文」開始創作"
        }
      />
    </div>
  );
}

function TabLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}
