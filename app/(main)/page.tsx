import Link from "next/link";
import { db } from "@/lib/db";
import { HeroBanner, type HeroSlide } from "@/components/home/hero-banner";
import { QuickNav } from "@/components/home/quick-nav";
import { FeedCard, type FeedCardPost } from "@/components/home/feed-card";
import { ChevronRight, Flame, Clock, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "首頁",
  description: "JKForum — 綜合型社群論壇平台：熱門討論、最新文章、精華推薦",
};

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "welcome",
    title: "歡迎來到 JKForum",
    subtitle: "分享、討論、交流 — 綜合型社群論壇平台",
    href: "/forums",
    gradientFrom: "#6366f1",
    gradientTo: "#ec4899",
    emoji: "🌊",
  },
  {
    id: "vip",
    title: "升級 VIP 享受完整體驗",
    subtitle: "月卡 $99 解鎖隱藏內容、雙倍簽到金幣、VIP 專屬勳章",
    href: "/vip",
    gradientFrom: "#f59e0b",
    gradientTo: "#ef4444",
    emoji: "👑",
  },
  {
    id: "checkin",
    title: "每日簽到拿金幣",
    subtitle: "連續簽到獎勵翻倍 — 每天花 3 秒累積你的虛擬財富",
    href: "/checkin",
    gradientFrom: "#10b981",
    gradientTo: "#06b6d4",
    emoji: "🎁",
  },
];

async function getFeedPosts(opts: {
  limit: number;
  sort: "hot" | "latest" | "featured";
}): Promise<FeedCardPost[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const where =
    opts.sort === "featured"
      ? { status: "PUBLISHED" as const, isFeatured: true }
      : opts.sort === "hot"
      ? { status: "PUBLISHED" as const, createdAt: { gte: sevenDaysAgo } }
      : { status: "PUBLISHED" as const };

  const orderBy: Array<Record<string, "desc" | "asc">> =
    opts.sort === "hot"
      ? [{ likeCount: "desc" }, { replyCount: "desc" }, { viewCount: "desc" }]
      : opts.sort === "featured"
      ? [{ featuredAt: "desc" }]
      : [{ createdAt: "desc" }];

  const raw = await db.post.findMany({
    where,
    orderBy,
    take: opts.limit,
    include: {
      author: {
        select: {
          id: true,
          displayName: true,
          profile: { select: { avatarUrl: true } },
        },
      },
      forum: {
        select: {
          id: true,
          name: true,
          slug: true,
          category: { select: { slug: true } },
        },
      },
    },
  });

  const extractFirstImg = (html: string | null | undefined): string | null => {
    if (!html) return null;
    const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return m?.[1] ?? null;
  };

  return raw.map((p) => ({
    id: p.id,
    title: p.title,
    excerpt: p.excerpt,
    createdAt: p.createdAt,
    viewCount: p.viewCount,
    likeCount: p.likeCount,
    replyCount: p.replyCount,
    isPinned: p.isPinned,
    isFeatured: p.isFeatured,
    coverImageUrl: extractFirstImg(p.content),
    author: {
      id: p.author.id,
      displayName: p.author.displayName,
      avatarUrl: p.author.profile?.avatarUrl ?? null,
    },
    forum: p.forum
      ? {
          name: p.forum.name,
          slug: p.forum.slug,
          categorySlug: p.forum.category?.slug,
        }
      : undefined,
  }));
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  moreHref?: string;
  posts: FeedCardPost[];
}

function Section({ title, icon, moreHref, posts }: SectionProps) {
  if (posts.length === 0) return null;
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
          {icon}
          {title}
        </h2>
        {moreHref && (
          <Link
            href={moreHref}
            className="flex items-center gap-0.5 text-sm text-muted-foreground hover:text-primary"
          >
            看更多
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {posts.map((p) => (
          <FeedCard key={p.id} post={p} />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [hot, latest, featured] = await Promise.all([
    getFeedPosts({ limit: 8, sort: "hot" }),
    getFeedPosts({ limit: 8, sort: "latest" }),
    getFeedPosts({ limit: 4, sort: "featured" }),
  ]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <HeroBanner slides={HERO_SLIDES} />

      {/* Quick Nav */}
      <QuickNav />

      {/* Hot */}
      <Section
        title="熱門文章"
        icon={<Flame className="h-6 w-6 text-orange-500" />}
        moreHref="/hot"
        posts={hot}
      />

      {/* Featured */}
      {featured.length > 0 && (
        <Section
          title="精華推薦"
          icon={<Sparkles className="h-6 w-6 text-yellow-500" />}
          posts={featured}
        />
      )}

      {/* Latest */}
      <Section
        title="最新文章"
        icon={<Clock className="h-6 w-6 text-primary" />}
        moreHref="/latest"
        posts={latest}
      />
    </div>
  );
}
