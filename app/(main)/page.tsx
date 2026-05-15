/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { HeroBanner, type HeroSlide } from "@/components/home/hero-banner";
import { ListingFilters } from "@/components/listing/listing-filters";
import { AdCard } from "@/components/listing/ad-card";
import { PostAdCta } from "@/components/listing/post-cta";
import { RegionQuickPicker } from "@/components/listing/region-quick-picker";
import { hasPassedAgeGate } from "@/lib/age-gate";
import { Flame, ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "店家總覽 — JKForum",
  description: "JKForum 店家總覽 — 全台優質店家、Tier 分級、地區精準篩選",
};

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "listing-tw",
    title: "🏪 全台店家總覽",
    subtitle: "5 大版區 · 22 縣市 · Tier 分級 · 即時更新",
    href: "/?tier=T3000",
    imageUrl: "https://picsum.photos/seed/jkf-store-hero/1600/600",
    badge: "新版",
  },
  {
    id: "listing-vip",
    title: "🔥 熱門精選店家",
    subtitle: "高評分・多瀏覽・Tier 加權推薦",
    href: "/?tier=T2000",
    imageUrl: "https://picsum.photos/seed/jkf-store-hot/1600/600",
    badge: "HOT",
  },
  {
    id: "listing-post",
    title: "💼 業者專區",
    subtitle: "免費刊登 / 付費置頂 / Tier 升級曝光",
    href: "/listing",
    imageUrl: "https://picsum.photos/seed/jkf-store-biz/1600/600",
  },
];

const TIER_RANK: Record<string, number> = { T3000: 5, T2000: 4, T1000: 3, T500: 2, FREE: 1 };
const PAGE_SIZE = 20;

function pickStr(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const page = Math.max(1, Number(searchParams.page ?? 1));

  const where: any = { status: "ACTIVE" };
  const city = pickStr(searchParams.city);
  const district = pickStr(searchParams.district);
  const tier = pickStr(searchParams.tier);
  const forumParam = pickStr(searchParams.forum);
  const q = pickStr(searchParams.q);
  if (city) where.city = city;
  if (district) where.district = district;
  if (tier && tier !== "ALL") where.tier = tier;
  if (forumParam) where.forumId = forumParam;
  if (q) where.OR = [{ title: { contains: q, mode: "insensitive" } }];

  const session = await getServerSession(authOptions);
  const since = new Date(Date.now() - 7 * 86400000);
  const me = session?.user?.id
    ? await db.user.findUnique({
        where: { id: session.user.id },
        select: { smsVerified: true },
      })
    : null;

  const [forums, regionRows, ads, total, hot, hotAds, verifiedMerchants] = await Promise.all([
    db.forum.findMany({
      where: { allowPaidListing: true, isVisible: true },
      select: { id: true, name: true, slug: true, rating: true, ageGateEnabled: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.region.findMany({ where: { isActive: true }, orderBy: [{ city: "asc" }, { sortOrder: "asc" }] }),
    db.businessAd.findMany({
      where,
      orderBy: [{ tier: "desc" }, { sortWeight: "desc" }, { publishedAt: "desc" }],
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    db.businessAd.count({ where }),
    db.$queryRaw<Array<{ query: string; cnt: bigint }>>`
      SELECT query, COUNT(*)::bigint AS cnt
      FROM search_logs
      WHERE created_at >= ${since}
      GROUP BY query ORDER BY cnt DESC LIMIT 8
    `.catch(() => [] as any[]),
    // 熱門店家：純 page 1 + 沒有任何 filter 才顯示
    page === 1 && !city && !district && !tier && !forumParam && !q
      ? db.businessAd.findMany({
          where: { status: "ACTIVE" },
          orderBy: [{ viewCount: "desc" }, { ratingAvg: "desc" }],
          take: 6,
        })
      : Promise.resolve([] as any[]),
    db.user.findMany({
      where: { userType: "BUSINESS", merchantVerified: true },
      select: { id: true },
    }),
  ]);

  const hotKeywords = hot.map((r) => r.query);
  const verifiedSet = new Set(verifiedMerchants.map((m) => m.id));
  const r18ForumIds = new Set(
    forums.filter((f) => f.rating === "R18" || f.ageGateEnabled).map((f) => f.id)
  );
  const canSeeR18 = await hasPassedAgeGate(session?.user?.id);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  ads.sort((a, b) => (TIER_RANK[b.tier] - TIER_RANK[a.tier]) || (b.sortWeight - a.sortWeight));

  const regions: Record<string, string[]> = {};
  for (const r of regionRows) (regions[r.city] ||= []).push(r.district);

  const forumMap = new Map(forums.map((f) => [f.id, f]));

  // 撈所有出現在卡片的發文者資料（admin 也是 user，店家總覽本質仍是論壇）
  const merchantIds = Array.from(new Set([...ads.map((a) => a.merchantId), ...hotAds.map((a: any) => a.merchantId)]));
  const merchantUsers = merchantIds.length
    ? await db.user.findMany({
        where: { id: { in: merchantIds } },
        select: { id: true, username: true, name: true, image: true },
      })
    : [];
  const userMap = new Map(merchantUsers.map((u) => [u.id, u]));

  const toCardProps = (a: any) => {
    const u = userMap.get(a.merchantId);
    return {
      id: a.id,
      title: a.title,
      city: a.city,
      district: a.district,
      coverImageUrl: a.coverImageUrl,
      tier: a.tier,
      priceMin: a.priceMin,
      priceMax: a.priceMax,
      ratingAvg: a.ratingAvg,
      ratingCount: a.ratingCount,
      viewCount: a.viewCount,
      favoriteCount: a.favoriteCount,
      tags: (a.tags as string[]) ?? [],
      forumName: forumMap.get(a.forumId)?.name ?? "",
      merchantVerified: verifiedSet.has(a.merchantId),
      isR18: r18ForumIds.has(a.forumId),
      canSeeR18,
      author: u
        ? { id: u.id, username: u.username, name: u.name || u.username, image: u.image || null }
        : null,
    };
  };

  return (
    <div className="space-y-5">
      {/* Hero */}
      <HeroBanner slides={HERO_SLIDES} />

      {/* 標題列 + 發廣告 CTA */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">🏪 店家總覽</h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            共 {total} 則 上架中（第 {page} / {totalPages} 頁）
          </p>
        </div>
        <PostAdCta
          isAuthenticated={!!session?.user}
          smsVerified={!!me?.smsVerified}
        />
      </header>

      {/* 地區快選 */}
      <RegionQuickPicker
        regions={regions}
        currentCity={city ?? ""}
        currentDistrict={district ?? ""}
      />

      {/* 進階篩選器 */}
      <ListingFilters
        forums={forums.map((f) => ({ id: f.id, name: f.name }))}
        regions={regions}
        hotKeywords={hotKeywords}
        current={{
          city: city ?? "",
          district: district ?? "",
          tier: tier ?? "ALL",
          forum: forumParam ?? "",
          q: q ?? "",
        }}
      />

      {/* 熱門店家（page 1 + 無 filter 才出現） */}
      {hotAds.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <h2 className="flex items-center gap-1.5 text-base font-bold sm:text-lg">
              <Flame className="h-5 w-5 text-orange-500" />
              熱門店家
            </h2>
            <Link
              href="/?tier=T3000"
              className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary"
            >
              看更多
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {hotAds.map((a: any) => (
              <AdCard key={`hot-${a.id}`} ad={toCardProps(a)} />
            ))}
          </div>
        </section>
      )}

      {/* 全部店家 */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-base font-bold sm:text-lg">
            {hotAds.length > 0 ? "全部店家" : "店家清單"}
          </h2>
        </div>

        {ads.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
            無符合條件的店家，請調整篩選條件
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {ads.map((a: any) => (
                <AdCard key={a.id} ad={toCardProps(a)} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-1 pt-4">
                {page > 1 && (
                  <Link href={hrefForPage(searchParams, page - 1)} className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted">
                    ← 上一頁
                  </Link>
                )}
                <span className="px-3 py-1.5 text-xs text-muted-foreground">{page} / {totalPages}</span>
                {page < totalPages && (
                  <Link href={hrefForPage(searchParams, page + 1)} className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted">
                    下一頁 →
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function hrefForPage(sp: Record<string, string | string[] | undefined>, p: number): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (!v || k === "page") continue;
    if (Array.isArray(v)) {
      const first = v[0];
      if (first) params.set(k, String(first));
    } else {
      params.set(k, String(v));
    }
  }
  if (p > 1) params.set("page", String(p));
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}
