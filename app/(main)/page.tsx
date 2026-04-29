/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { db } from "@/lib/db";
import { HeroBanner, DualHeroBanner, type HeroSlide } from "@/components/home/hero-banner";
import { QuickNav } from "@/components/home/quick-nav";
import { FeedCard, type FeedCardPost } from "@/components/home/feed-card";
import { HorizontalFeed } from "@/components/home/horizontal-feed";
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
    subtitle: "綜合型社群論壇 — 13 大類 / 55 版區 / 每日數百篇新文",
    href: "/forums",
    imageUrl: "https://picsum.photos/seed/jkf-hero-welcome/1600/600",
    badge: "新版",
  },
  {
    id: "game-center",
    title: "🎮 遊戲中心 全新上線",
    subtitle: "挖礦・地形探索・寶箱・道具合成 — 用體力換稀有道具",
    href: "/achieve/game",
    imageUrl: "https://picsum.photos/seed/jkf-hero-game/1600/600",
    badge: "新功能",
  },
  {
    id: "vip",
    title: "升級 VIP 享受完整體驗",
    subtitle: "解鎖隱藏內容・雙倍簽到金幣・專屬勳章・閱讀權限提升至 150",
    href: "/vip",
    imageUrl: "https://picsum.photos/seed/jkf-hero-vip/1600/600",
    badge: "限時",
  },
  {
    id: "chat",
    title: "💬 即時聊天室",
    subtitle: "6 個主題聊天室全天開放 — 大廳・閒聊・遊戲・新聞・3C・成人區",
    href: "/chat",
    imageUrl: "https://picsum.photos/seed/jkf-hero-chat/1600/600",
  },
];

const DUAL_HERO_LEFT: HeroSlide = {
  id: "blog-promo",
  title: "📓 個人日誌",
  subtitle: "寫下你的故事，分享給世界",
  href: "/blog",
  imageUrl: "https://picsum.photos/seed/jkf-promo-blog/800/400",
  badge: "NEW",
};
const DUAL_HERO_RIGHT: HeroSlide = {
  id: "leaderboard-promo",
  title: "🏆 排行榜",
  subtitle: "看看誰是 JKForum 的活躍王者",
  href: "/leaderboard",
  imageUrl: "https://picsum.photos/seed/jkf-promo-rank/800/400",
};

async function getFeedPosts(opts: {
  limit: number;
  sort: "hot" | "latest" | "featured";
  forumSlugs?: string[];
  rating?: "G" | "PG13" | "R18";
}): Promise<FeedCardPost[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const where: any =
    opts.sort === "featured"
      ? { status: "PUBLISHED" as const, isFeatured: true }
      : opts.sort === "hot"
      ? { status: "PUBLISHED" as const, createdAt: { gte: sevenDaysAgo } }
      : { status: "PUBLISHED" as const };

  if (opts.forumSlugs && opts.forumSlugs.length > 0) {
    where.forum = { slug: { in: opts.forumSlugs } };
  }
  if (opts.rating) {
    where.rating = opts.rating;
  }

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
  const [hot, latest, featured, jkfGirls, choice, news] = await Promise.all([
    getFeedPosts({ limit: 8, sort: "hot" }),
    getFeedPosts({ limit: 8, sort: "latest" }),
    getFeedPosts({ limit: 4, sort: "featured" }),
    // 「JKF 女郎」— 取 R-18 寫真區的熱門
    getFeedPosts({
      limit: 10,
      sort: "hot",
      forumSlugs: ["adult-pics-cool", "adult-pics-sexy"],
      rating: "R18",
    }),
    // Choice: 主題版精選
    getFeedPosts({
      limit: 10,
      sort: "hot",
      forumSlugs: ["chitchat", "feelings", "entertainment", "trivia", "mysteries"],
    }),
    // News: 新聞時事
    getFeedPosts({
      limit: 10,
      sort: "latest",
      forumSlugs: ["world-news", "taiwan-news", "politics", "mobile", "hardware"],
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <HeroBanner slides={HERO_SLIDES} />

      {/* Dual promo */}
      <DualHeroBanner left={DUAL_HERO_LEFT} right={DUAL_HERO_RIGHT} />

      {/* Quick Nav */}
      <QuickNav />

      {/* JKF 女郎 — 橫向滾動 */}
      {jkfGirls.length > 0 && (
        <HorizontalFeed
          title="JKF 女郎"
          emoji="👯"
          badge="HOT"
          posts={jkfGirls}
          moreHref="/forums/adult-entertainment/adult-pics-cool"
        />
      )}

      {/* Hot */}
      <Section
        title="熱門文章"
        icon={<Flame className="h-6 w-6 text-orange-500" />}
        moreHref="/hot"
        posts={hot}
      />

      {/* Choice — 主題精選 */}
      {choice.length > 0 && (
        <HorizontalFeed
          title="Focus 掌握網路大小事-Choice"
          emoji="🎯"
          posts={choice}
        />
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <Section
          title="精華推薦"
          icon={<Sparkles className="h-6 w-6 text-yellow-500" />}
          posts={featured}
        />
      )}

      {/* News — 新聞時事 */}
      {news.length > 0 && (
        <HorizontalFeed
          title="Focus 掌握網路大小事-News"
          emoji="📰"
          posts={news}
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
