/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { BadgeCheck, ArrowLeft } from "lucide-react";
import { AdCard } from "@/components/listing/ad-card";
import { formatNumber } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function MerchantPublicPage({ params }: { params: { id: string } }) {
  const [merchant, ads, allAds] = await Promise.all([
    db.user.findFirst({
      where: { id: params.id, userType: "BUSINESS" },
      select: {
        id: true, merchantName: true, merchantBio: true, merchantVerified: true,
        displayName: true, coverPhotoUrl: true,
        profile: { select: { avatarUrl: true } },
      },
    }),
    db.businessAd.findMany({
      where: { merchantId: params.id, status: "ACTIVE" },
      orderBy: [{ tier: "desc" }, { sortWeight: "desc" }],
      take: 60,
    }),
    db.businessAd.findMany({
      where: { merchantId: params.id },
      select: { id: true, viewCount: true, favoriteCount: true, ratingAvg: true, ratingCount: true },
    }),
  ]);

  if (!merchant) notFound();

  const forums = ads.length
    ? await db.forum.findMany({
        where: { id: { in: Array.from(new Set(ads.map((a) => a.forumId))) } },
        select: { id: true, name: true },
      })
    : [];
  const forumMap = new Map(forums.map((f) => [f.id, f]));

  const totalViews = allAds.reduce((s, a) => s + a.viewCount, 0);
  const totalFavs = allAds.reduce((s, a) => s + a.favoriteCount, 0);
  const ratedAds = allAds.filter((a) => a.ratingCount > 0);
  const avgRating = ratedAds.length
    ? ratedAds.reduce((s, a) => s + a.ratingAvg, 0) / ratedAds.length
    : 0;

  return (
    <div className="space-y-5">
      <Link href="/listing" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> 店家總覽
      </Link>

      {/* 業者頭資訊 */}
      <header className="overflow-hidden rounded-2xl border bg-card">
        {merchant.coverPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={merchant.coverPhotoUrl} alt="" className="h-32 w-full object-cover" />
        ) : (
          <div className="h-20 bg-gradient-to-r from-primary/20 to-fuchsia-500/20" />
        )}
        <div className="flex items-start gap-4 p-5">
          {merchant.profile?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={merchant.profile.avatarUrl} alt="" className="h-16 w-16 -mt-10 rounded-full border-4 border-card object-cover" />
          ) : (
            <div className="flex h-16 w-16 -mt-10 items-center justify-center rounded-full border-4 border-card bg-muted text-2xl">🏢</div>
          )}
          <div className="flex-1">
            <h1 className="flex items-center gap-1.5 text-xl font-bold">
              {merchant.merchantName ?? merchant.displayName}
              {merchant.merchantVerified && (
                <span title="業者已認證" className="text-emerald-400"><BadgeCheck className="h-5 w-5" /></span>
              )}
            </h1>
            {merchant.merchantBio && (
              <p className="mt-1 text-sm text-muted-foreground">{merchant.merchantBio}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>📣 {allAds.length} 則廣告</span>
              <span>👁 {formatNumber(totalViews)} 瀏覽</span>
              <span>❤ {formatNumber(totalFavs)} 收藏</span>
              {avgRating > 0 && <span>⭐ {avgRating.toFixed(1)} 平均評分</span>}
            </div>
          </div>
        </div>
      </header>

      <h2 className="text-sm font-bold">📋 上架中的廣告 ({ads.length})</h2>
      {ads.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          暫無上架廣告
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {ads.map((a) => (
            <AdCard key={a.id} ad={{
              id: a.id, title: a.title, city: a.city, district: a.district,
              coverImageUrl: a.coverImageUrl, tier: a.tier,
              priceMin: a.priceMin, priceMax: a.priceMax,
              ratingAvg: a.ratingAvg, ratingCount: a.ratingCount,
              viewCount: a.viewCount, favoriteCount: a.favoriteCount,
              tags: (a.tags as string[]) ?? [],
              forumName: forumMap.get(a.forumId)?.name ?? "",
              merchantVerified: !!merchant.merchantVerified,
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
