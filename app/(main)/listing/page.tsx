/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ListingFilters } from "@/components/listing/listing-filters";
import { AdCard } from "@/components/listing/ad-card";
import { PostAdCta } from "@/components/listing/post-cta";
import { AdvancedFilterPanel } from "@/components/listing/advanced-filter-panel";
import {
  buildBusinessAdAdvancedWhere,
  parseAdvancedFilterParams,
  safeParseFilterDefs,
} from "@/lib/advanced-filters";

export const dynamic = "force-dynamic";

async function getRecommended(userId: string | undefined) {
  if (!userId) return [];
  const favs = await db.businessAdFavorite.findMany({
    where: { userId }, orderBy: { createdAt: "desc" }, take: 10,
  });
  if (favs.length === 0) return [];
  const favAdIds = favs.map((f) => f.adId);
  const favAds = await db.businessAd.findMany({
    where: { id: { in: favAdIds } },
    select: { city: true, forumId: true },
  });
  const cities = Array.from(new Set(favAds.map((a) => a.city))).filter(Boolean);
  const forumIds = Array.from(new Set(favAds.map((a) => a.forumId))).filter(Boolean);
  if (cities.length === 0 && forumIds.length === 0) return [];
  return db.businessAd.findMany({
    where: {
      status: "ACTIVE",
      id: { notIn: favAdIds },
      OR: [
        ...(cities.length ? [{ city: { in: cities } }] : []),
        ...(forumIds.length ? [{ forumId: { in: forumIds } }] : []),
      ],
    },
    orderBy: [{ tier: "desc" }, { sortWeight: "desc" }],
    take: 6,
  });
}

const TIER_RANK: Record<string, number> = { T3000: 5, T2000: 4, T1000: 3, T500: 2, FREE: 1 };
const PAGE_SIZE = 30;

export default async function ListingHomePage({
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

  // 取選定 forum 的 advancedFilters；沒選則是空的
  const selectedForum = forumParam
    ? await db.forum.findUnique({
        where: { id: forumParam },
        select: { advancedFiltersJson: true },
      })
    : null;
  const filterDefs = safeParseFilterDefs(selectedForum?.advancedFiltersJson);
  const parsedAdv = parseAdvancedFilterParams(searchParams, filterDefs);
  const advWhere = buildBusinessAdAdvancedWhere(parsedAdv);
  if (advWhere.length) where.AND = [...(where.AND ?? []), ...advWhere];

  const [forums, regionRows, ads, total, hot, recommended, verifiedMerchants] = await Promise.all([
    db.forum.findMany({
      where: { allowPaidListing: true, isVisible: true },
      select: { id: true, name: true, slug: true, advancedFiltersJson: true },
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
      GROUP BY query ORDER BY cnt DESC LIMIT 10
    `.catch(() => [] as any[]),
    getRecommended(session?.user?.id),
    db.user.findMany({
      where: { userType: "BUSINESS", merchantVerified: true },
      select: { id: true },
    }),
  ]);
  const hotKeywords = hot.map((r) => r.query);
  const verifiedSet = new Set(verifiedMerchants.map((m) => m.id));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // 排序：tier 大>小，再依 sortWeight
  ads.sort((a, b) => (TIER_RANK[b.tier] - TIER_RANK[a.tier]) || (b.sortWeight - a.sortWeight));

  const regions: Record<string, string[]> = {};
  for (const r of regionRows) (regions[r.city] ||= []).push(r.district);

  const forumMap = new Map(forums.map((f) => [f.id, f]));

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🏪 店家總覽</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            共 {total} 則 上架中（第 {page} / {totalPages} 頁）
          </p>
        </div>
        <PostAdCta
          isAuthenticated={!!session?.user}
          smsVerified={!!me?.smsVerified}
        />
      </header>

      {recommended.length > 0 && page === 1 && !q && (
        <section className="rounded-2xl border bg-gradient-to-br from-fuchsia-500/10 via-transparent to-transparent p-3">
          <h2 className="mb-2 text-sm font-bold">✨ 為您推薦（基於您的收藏）</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {recommended.map((a) => (
              <AdCard key={a.id} ad={{
                id: a.id, title: a.title, city: a.city, district: a.district,
                coverImageUrl: a.coverImageUrl, tier: a.tier,
                priceMin: a.priceMin, priceMax: a.priceMax,
                ratingAvg: a.ratingAvg, ratingCount: a.ratingCount,
                viewCount: a.viewCount, favoriteCount: a.favoriteCount,
                tags: (a.tags as string[]) ?? [],
                forumName: forumMap.get(a.forumId)?.name ?? "",
                merchantVerified: verifiedSet.has(a.merchantId),
              }} />
            ))}
          </div>
        </section>
      )}

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

      {/* 進階搜尋（per-forum）— 選了版區才出現對應 filter */}
      {forumParam && filterDefs.length > 0 && (
        <AdvancedFilterPanel
          filterDefsRaw={selectedForum?.advancedFiltersJson}
          initialOpen={Object.keys(parsedAdv).length > 0}
          scope="listing"
        />
      )}

      {ads.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          無符合條件的廣告
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {ads.map((a) => (
              <AdCard
                key={a.id}
                ad={{
                  id: a.id, title: a.title, city: a.city, district: a.district,
                  coverImageUrl: a.coverImageUrl, tier: a.tier,
                  priceMin: a.priceMin, priceMax: a.priceMax,
                  ratingAvg: a.ratingAvg, ratingCount: a.ratingCount,
                  viewCount: a.viewCount, favoriteCount: a.favoriteCount,
                  tags: (a.tags as string[]) ?? [],
                  forumName: forumMap.get(a.forumId)?.name ?? "",
                }}
              />
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
    </div>
  );
}

function hrefForPage(sp: any, p: number): string {
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
  params.set("page", String(p));
  return `?${params.toString()}`;
}

function pickStr(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}
