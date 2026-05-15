"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Heart, Star, MapPin, BadgeCheck, EyeOff, ChevronRight } from "lucide-react";
import { UserHoverCard } from "@/components/user/user-hover-card";

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
      {/* 左：方形圖（放大讓 tag 不擠） */}
      <div className="relative aspect-square w-36 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-44">
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
          <span className={`absolute left-1.5 top-1.5 rounded-md px-2 py-1 text-xs font-extrabold shadow-sm ${badge.cls}`}>
            {badge.label}
          </span>
        )}

        {/* R18 徽章 */}
        {ad.isR18 && (
          <span className="absolute left-1.5 bottom-1.5 z-20 rounded-full bg-rose-600 px-2 py-1 text-xs font-extrabold text-white shadow-md">
            18+
          </span>
        )}

        {/* 業者認證徽章（顯眼放大）*/}
        {ad.merchantVerified && (
          <span
            title="已認證"
            className="absolute right-1.5 top-1.5 z-20 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-extrabold text-white shadow-lg ring-2 ring-white"
          >
            <BadgeCheck className="h-4 w-4" />
            <span>已認證</span>
          </span>
        )}
      </div>

      {/* 右：資訊區 */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {/* 標題 */}
        <h3 className="line-clamp-2 text-base font-bold leading-tight text-foreground sm:text-lg">
          {ad.title}
        </h3>

        {/* 作者（發文者）— hover 顯示用戶卡，點擊跳個人空間 */}
        {ad.author && (
          <UserHoverCard userId={ad.author.id}>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/profile/${ad.author!.id}`);
              }}
              className="inline-flex min-w-0 max-w-full items-center gap-2 self-start rounded-full bg-muted py-1 pl-1 pr-3 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              {ad.author.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ad.author.image} alt={ad.author.name} className="h-7 w-7 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {ad.author.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="truncate font-semibold text-foreground">{ad.author.name}</span>
              {ad.merchantVerified && (
                <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              )}
            </span>
          </UserHoverCard>
        )}

        {/* 地點 + 版區 */}
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground/80">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4 text-rose-500" />
            <span>{ad.city} {ad.district}</span>
          </span>
          {ad.forumName && (
            <span className="rounded-md bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
              {ad.forumName}
            </span>
          )}
        </div>

        {/* 標籤 chips（最多 3 個） */}
        {ad.tags && ad.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {ad.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* 價位 */}
        {(ad.priceMin != null || ad.priceMax != null) && (
          <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400">
            {ad.priceMin != null ? `$${ad.priceMin}` : "?"}
            {(ad.priceMin != null && ad.priceMax != null) ? "~" : ""}
            {ad.priceMax != null ? `$${ad.priceMax}` : ""}
          </div>
        )}

        {/* 底部統計（放大顯眼但允許 wrap，避免溢出） */}
        <div className="mt-auto flex items-center justify-between gap-1 pt-2 text-sm">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-foreground/70">
            {ad.ratingCount > 0 ? (
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-base font-extrabold text-foreground">{ad.ratingAvg.toFixed(1)}</span>
                <span className="text-xs opacity-80">({ad.ratingCount})</span>
              </span>
            ) : (
              <span className="text-xs opacity-60">無評</span>
            )}
            <span className="inline-flex items-center gap-0.5">
              <Eye className="h-4 w-4" /> <span className="text-sm font-bold text-foreground">{ad.viewCount}</span>
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Heart className="h-4 w-4" /> <span className="text-sm font-bold text-foreground">{ad.favoriteCount}</span>
            </span>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
        </div>
      </div>
    </Link>
  );
}
