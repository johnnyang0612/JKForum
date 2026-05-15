"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Heart, Star, MapPin, BadgeCheck, EyeOff, ChevronRight } from "lucide-react";

const TIER_BADGE: Record<string, { label: string; cls: string }> = {
  T3000: { label: "🔥 置頂", cls: "bg-amber-500 text-zinc-900" },
  T2000: { label: "⭐ 精選", cls: "bg-fuchsia-500 text-white" },
  T1000: { label: "👑 推薦", cls: "bg-rose-500 text-white" },
  T500:  { label: "🌟", cls: "bg-blue-500 text-white" },
  FREE:  { label: "", cls: "" },
};

export function AdCard({ ad }: {
  ad: {
    id: string; title: string; city: string; district: string;
    coverImageUrl: string | null; tier: string;
    priceMin: number | null; priceMax: number | null;
    ratingAvg: number; ratingCount: number;
    viewCount: number; favoriteCount: number;
    tags: string[]; forumName: string;
    merchantVerified?: boolean;
    /** R18 板區（自 forum.rating 派生）*/
    isR18?: boolean;
    /** 使用者是否已通過年齡確認 */
    canSeeR18?: boolean;
    /** 發文者（店家總覽本質仍是論壇，每則貼文都有作者）*/
    author?: { id: string; username: string; name: string; image: string | null } | null;
  };
}) {
  const badge = TIER_BADGE[ad.tier];
  const router = useRouter();
  const initialBlur = !!(ad.isR18 && !ad.canSeeR18);
  const [revealed, setRevealed] = useState(false);
  const isBlurred = initialBlur && !revealed;

  function trackClick() {
    try {
      fetch(`/api/business/ads/${ad.id}/track-click`, {
        method: "POST",
        keepalive: true,
      }).catch(() => null);
    } catch {/* ignore */}
  }

  function handleClick(e: React.MouseEvent) {
    if (initialBlur && !ad.canSeeR18) {
      e.preventDefault();
      router.push(`/age-gate?next=${encodeURIComponent(`/listing/ad/${ad.id}`)}`);
      return;
    }
    trackClick();
  }

  function reveal(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (ad.canSeeR18) {
      setRevealed(true);
    } else {
      router.push(`/age-gate?next=${encodeURIComponent(`/listing/ad/${ad.id}`)}`);
    }
  }

  return (
    <Link
      href={`/listing/ad/${ad.id}`}
      onClick={handleClick}
      className="group flex gap-3 rounded-xl border bg-card p-2.5 transition-all hover:border-primary/50 hover:shadow-md sm:gap-4 sm:p-3"
    >
      {/* 左：方形圖 */}
      <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-36">
        {ad.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ad.coverImageUrl}
            alt={ad.title}
            loading="lazy"
            className={`h-full w-full object-cover transition-all duration-300 group-hover:scale-105 ${
              isBlurred ? "blur-2xl scale-110" : ""
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl">🏪</div>
        )}

        {/* R18 blur 覆蓋層 */}
        {isBlurred && (
          <button
            type="button"
            onClick={reveal}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-black/60 text-white"
          >
            <EyeOff className="h-5 w-5" />
            <span className="text-[11px] font-bold">🔞 R-18</span>
            <span className="text-[10px] opacity-80">點擊顯示</span>
          </button>
        )}

        {/* tier badge */}
        {badge.label && (
          <span className={`absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${badge.cls}`}>
            {badge.label}
          </span>
        )}

        {/* R18 徽章 */}
        {ad.isR18 && (
          <span className="absolute left-1.5 bottom-1.5 z-20 rounded-full bg-rose-600/95 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
            18+
          </span>
        )}

        {/* 業者認證徽章（顯眼放大）*/}
        {ad.merchantVerified && (
          <span
            title="已認證"
            className="absolute right-1.5 top-1.5 z-20 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-1 text-[11px] font-bold text-white shadow-lg ring-2 ring-white"
          >
            <BadgeCheck className="h-4 w-4" />
            <span className="hidden sm:inline">已認證</span>
          </span>
        )}
      </div>

      {/* 右：資訊區 */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {/* 標題 */}
        <h3 className="line-clamp-2 text-base font-bold leading-tight text-foreground sm:text-lg">
          {ad.title}
        </h3>

        {/* 作者（發文者）— 店家總覽本質仍是論壇 */}
        {ad.author && (
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(`/profile/${ad.author!.username || ad.author!.id}`);
            }}
            className="inline-flex items-center gap-2 self-start rounded-full bg-muted/60 py-1 pl-1 pr-2.5 text-xs hover:bg-muted"
          >
            {ad.author.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ad.author.image} alt={ad.author.name} className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                {ad.author.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-foreground">{ad.author.name}</span>
            {ad.merchantVerified && (
              <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />
            )}
          </div>
        )}

        {/* 地點 + 版區 */}
        <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-0.5 font-medium">
            <MapPin className="h-3.5 w-3.5" />
            {ad.city} {ad.district}
          </span>
          {ad.forumName && (
            <>
              <span className="opacity-40">·</span>
              <span className="rounded bg-muted px-2 py-0.5 text-xs">{ad.forumName}</span>
            </>
          )}
        </div>

        {/* 標籤 chips（最多 3 個） */}
        {ad.tags && ad.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ad.tags.slice(0, 3).map((t) => (
              <span key={t} className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* 價位 */}
        {(ad.priceMin != null || ad.priceMax != null) && (
          <div className="text-base font-bold text-amber-600 dark:text-amber-400">
            {ad.priceMin != null ? `$${ad.priceMin}` : "?"}
            {(ad.priceMin != null && ad.priceMax != null) ? "~" : ""}
            {ad.priceMax != null ? `$${ad.priceMax}` : ""}
          </div>
        )}

        {/* 底部統計（放大顯眼） */}
        <div className="mt-auto flex items-center justify-between gap-1 pt-1.5 text-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            {ad.ratingCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-base font-bold text-foreground">{ad.ratingAvg.toFixed(1)}</span>
                <span className="text-xs opacity-70">({ad.ratingCount})</span>
              </span>
            ) : (
              <span className="text-xs opacity-50">無評</span>
            )}
            <span className="inline-flex items-center gap-1">
              <Eye className="h-4 w-4" /> <span className="font-semibold text-foreground">{ad.viewCount}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="h-4 w-4" /> <span className="font-semibold text-foreground">{ad.favoriteCount}</span>
            </span>
          </div>
          <ChevronRight className="h-5 w-5 opacity-40 transition-transform group-hover:translate-x-0.5 group-hover:opacity-80" />
        </div>
      </div>
    </Link>
  );
}
