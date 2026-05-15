/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Eye, Heart, Star, MapPin, BadgeCheck, ArrowLeft } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import { AdViewerClient } from "@/components/listing/ad-viewer-client";
import { AdComments } from "@/components/listing/ad-comments";
import { AdRatingSection } from "@/components/listing/ad-rating-section";
import { BusinessAdTagDisplay } from "@/components/listing/business-ad-tag-display";
import { ContactModalButton } from "@/components/listing/contact-modal-button";

export const dynamic = "force-dynamic";

const TIER_LABEL: Record<string, string> = {
  T3000: "🔥 置頂", T2000: "⭐ 精選", T1000: "👑 推薦", T500: "🌟 一般", FREE: "免費刊登",
};

export default async function PublicAdPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const ad = await db.businessAd.findUnique({
    where: { id: params.id },
    include: {
      tagAssigns: {
        include: {
          tag: {
            select: { id: true, name: true, category: true, isUnlimited: true, isActive: true },
          },
        },
      },
    },
  });
  if (!ad || ad.status !== "ACTIVE") notFound();

  const [forum, merchant, related, fav] = await Promise.all([
    db.forum.findUnique({ where: { id: ad.forumId }, select: { name: true, slug: true, category: { select: { slug: true } } } }),
    db.user.findUnique({
      where: { id: ad.merchantId },
      select: {
        merchantName: true, merchantBio: true, merchantVerified: true, displayName: true,
        profile: { select: { avatarUrl: true } },
      },
    }),
    db.businessAd.findMany({
      where: { status: "ACTIVE", forumId: ad.forumId, city: ad.city, id: { not: ad.id } },
      orderBy: [{ tier: "desc" }, { sortWeight: "desc" }],
      take: 6,
    }),
    session?.user
      ? db.businessAdFavorite.findUnique({
          where: { userId_adId: { userId: session.user.id, adId: ad.id } },
        })
      : Promise.resolve(null),
  ]);

  // 增加瀏覽數（不重複追蹤；這版簡單做）
  void db.businessAd.update({ where: { id: ad.id }, data: { viewCount: { increment: 1 } } }).catch(() => null);

  // 配合項目：優先使用新標籤系統 (tagAssigns)；舊資料仍 fall back 到 JSON tags
  const dictTags = ad.tagAssigns
    .map((a) => a.tag)
    .filter((t) => t && t.isActive)
    .map((t) => ({ id: t.id, name: t.name, category: t.category, isUnlimited: t.isUnlimited }));
  const legacyTags = (ad.tags as string[]) ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link href="/listing" className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> 店家總覽
      </Link>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 9:16 cover + 多圖 thumbnail strip */}
        <div className="space-y-2">
          <div className="relative aspect-[9/16] overflow-hidden rounded-2xl border bg-muted">
            {ad.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ad.coverImageUrl} alt={ad.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-7xl">🏪</div>
            )}
            <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-1 text-xs text-white">
              {TIER_LABEL[ad.tier] ?? ad.tier}
            </span>
          </div>
          {Array.isArray(ad.imageUrls) && (ad.imageUrls as string[]).length > 0 && (
            <div className="grid grid-cols-4 gap-1">
              {(ad.imageUrls as string[]).slice(0, 8).map((u, i) => (
                <a key={i} href={u} target="_blank" rel="noreferrer"
                   className="aspect-square overflow-hidden rounded-md bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt={`第 ${i + 1} 張`} loading="lazy" className="h-full w-full object-cover hover:scale-105 transition-transform" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* info */}
        <div className="space-y-3">
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">{ad.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-base font-medium text-foreground/80">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4 text-rose-500" />
                {ad.city} {ad.district}
              </span>
              <span className="opacity-50">·</span>
              <Link href={`/listing?forum=${ad.forumId}`} className="rounded-md bg-zinc-200 px-2 py-0.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200">{forum?.name}</Link>
            </div>
            {ad.ratingCount > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-base">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="text-lg font-extrabold">{ad.ratingAvg.toFixed(1)}</span>
                <span className="text-sm text-foreground/70">({ad.ratingCount} 評)</span>
              </div>
            )}
            <div className="mt-3 flex items-center gap-4 text-sm font-medium text-foreground/70">
              <span className="inline-flex items-center gap-1"><Eye className="h-4 w-4" /> <span className="text-base font-bold text-foreground">{formatNumber(ad.viewCount)}</span></span>
              <span className="inline-flex items-center gap-1"><Heart className="h-4 w-4" /> <span className="text-base font-bold text-foreground">{formatNumber(ad.favoriteCount)}</span></span>
            </div>
          </div>

          {(ad.priceMin != null || ad.priceMax != null) && (
            <div className="rounded-xl border-2 bg-card p-4">
              <p className="text-sm font-semibold text-foreground/70">💰 服務價格</p>
              <p className="mt-1 text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                ${ad.priceMin != null ? formatNumber(ad.priceMin) : "?"}
                {ad.priceMin != null && ad.priceMax != null ? " ~ $" : ""}
                {ad.priceMax != null ? formatNumber(ad.priceMax) : ""}
              </p>
            </div>
          )}

          {dictTags.length > 0 ? (
            <div className="rounded-xl border bg-card p-4">
              <p className="mb-2 text-sm font-semibold text-foreground/70">🏷️ 配合項目</p>
              <BusinessAdTagDisplay tags={dictTags} groupByCategory />
            </div>
          ) : legacyTags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {legacyTags.map((t) => (
                <span key={t} className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">{t}</span>
              ))}
            </div>
          ) : null}

          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm font-semibold text-foreground/70">📝 簡介</p>
            <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed">{ad.description}</p>
          </div>

          {/* 聯絡店家：付費顯示電話/LINE，免費僅站內私訊 */}
          <ContactModalButton
            adId={ad.id}
            merchantId={ad.merchantId}
            contactPhone={ad.contactPhone}
            contactLine={ad.contactLine}
            isAuthenticated={!!session?.user}
          />

          <Link href={`/listing/merchant/${ad.merchantId}`} className="block rounded-xl border-2 bg-card p-4 hover:border-primary">
            <div className="flex min-w-0 items-center gap-3">
              {merchant?.profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={merchant.profile.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-lg">🏢</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 text-base font-bold">
                  <span className="truncate">{merchant?.merchantName ?? merchant?.displayName ?? "未知商號"}</span>
                  {merchant?.merchantVerified && (
                    <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600" />
                  )}
                </p>
                {merchant?.merchantBio && (
                  <p className="line-clamp-1 text-sm text-foreground/70">{merchant.merchantBio}</p>
                )}
              </div>
              <span className="shrink-0 text-sm font-semibold text-primary">查看 →</span>
            </div>
          </Link>

          <AdViewerClient adId={ad.id} initialFav={!!fav} />
        </div>
      </div>

      {/* 富文本詳細介紹 */}
      {ad.contentHtml && (
        <section className="rounded-2xl border bg-card p-4 sm:p-5">
          <h2 className="mb-3 text-base font-bold">📋 詳細介紹</h2>
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: ad.contentHtml }}
          />
        </section>
      )}

      {/* 影音區 */}
      {Array.isArray(ad.videoUrls) && (ad.videoUrls as string[]).length > 0 && (
        <section className="rounded-2xl border bg-card p-4 sm:p-5">
          <h2 className="mb-3 text-base font-bold">🎬 店內影音</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(ad.videoUrls as string[]).slice(0, 3).map((url, i) => (
              <div key={i} className="aspect-video overflow-hidden rounded-lg border bg-black">
                <video src={url} className="h-full w-full" controls preload="metadata" playsInline />
              </div>
            ))}
          </div>
        </section>
      )}

      <AdRatingSection
        adId={ad.id}
        isAuthenticated={!!session?.user}
        currentUserId={session?.user?.id}
        merchantId={ad.merchantId}
        initialAvg={ad.ratingAvg}
        initialCount={ad.ratingCount}
      />

      <div id="comments">
        <AdComments adId={ad.id} merchantId={ad.merchantId} />
      </div>

      {related.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold">附近其他店家</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {related.map((r) => (
              <Link key={r.id} href={`/listing/ad/${r.id}`} className="group">
                <div className="aspect-[9/16] overflow-hidden rounded-lg bg-muted">
                  {r.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.coverImageUrl} alt={r.title} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl">🏪</div>
                  )}
                </div>
                <p className="mt-1 line-clamp-1 text-[10px]">{r.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
