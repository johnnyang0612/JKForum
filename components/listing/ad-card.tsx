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

        {/* 業者認證徽章 */}
        {ad.merchantVerified && (
          <span title="業者已認證" className="absolute right-1.5 top-1.5 z-20 rounded-full bg-emerald-500/95 p-0.5 text-white shadow-sm">
            <BadgeCheck className="h-3 w-3" />
          </span>
        )}
      </div>

      {/* 右：資訊區 */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* 標題 */}
        <h3 className="line-clamp-2 text-sm font-bold leading-tight text-foreground sm:text-base">
          {ad.title}
        </h3>

        {/* 地點 + 版區 */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-0.5">
            <MapPin className="h-3 w-3" />
            {ad.city} {ad.district}
          </span>
          {ad.forumName && (
            <>
              <span className="opacity-40">·</span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{ad.forumName}</span>
            </>
          )}
        </div>

        {/* 標籤 chips（最多 3 個） */}
        {ad.tags && ad.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ad.tags.slice(0, 3).map((t) => (
              <span key={t} className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* 價位 */}
        {(ad.priceMin != null || ad.priceMax != null) && (
          <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">
            {ad.priceMin != null ? `$${ad.priceMin}` : "?"}
            {(ad.priceMin != null && ad.priceMax != null) ? "~" : ""}
            {ad.priceMax != null ? `$${ad.priceMax}` : ""}
          </div>
        )}

        {/* 底部統計 */}
        <div className="mt-auto flex items-center justify-between gap-1 pt-1 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            {ad.ratingCount > 0 ? (
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">{ad.ratingAvg.toFixed(1)}</span>
                <span className="opacity-60">({ad.ratingCount})</span>
              </span>
            ) : (
              <span className="opacity-50">無評</span>
            )}
            <span className="inline-flex items-center gap-0.5">
              <Eye className="h-3 w-3" /> {ad.viewCount}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Heart className="h-3 w-3" /> {ad.favoriteCount}
            </span>
          </div>
          <ChevronRight className="h-4 w-4 opacity-40 transition-transform group-hover:translate-x-0.5 group-hover:opacity-80" />
        </div>
      </div>
    </Link>
  );
}
