"use client";

import Link from "next/link";
import { Eye, Heart, Star, MapPin, BadgeCheck } from "lucide-react";

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
  };
}) {
  const badge = TIER_BADGE[ad.tier];
  function trackClick() {
    // keepalive 確保 navigation 中也能送出
    try {
      fetch(`/api/business/ads/${ad.id}/track-click`, {
        method: "POST",
        keepalive: true,
      }).catch(() => null);
    } catch {
      // ignore
    }
  }
  return (
    <Link href={`/listing/ad/${ad.id}`} className="group block" onClick={trackClick}>
      <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-muted">
        {ad.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.coverImageUrl} alt={ad.title} loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl">🏪</div>
        )}

        {/* tier badge */}
        {badge.label && (
          <span className={`absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${badge.cls}`}>
            {badge.label}
          </span>
        )}

        {/* 業者認證徽章 */}
        {ad.merchantVerified && (
          <span title="業者已認證" className="absolute right-1.5 top-1.5 rounded-full bg-emerald-500/95 p-0.5 text-white shadow-sm">
            <BadgeCheck className="h-3 w-3" />
          </span>
        )}

        {/* bottom overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2 text-white">
          <p className="line-clamp-2 text-xs font-bold leading-tight">{ad.title}</p>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-white/80">
            <MapPin className="h-2.5 w-2.5" />
            {ad.city} {ad.district}
          </div>
          {(ad.priceMin != null || ad.priceMax != null) && (
            <div className="mt-0.5 text-[10px] text-amber-300">
              {ad.priceMin != null ? `$${ad.priceMin}` : "?"}
              {(ad.priceMin != null && ad.priceMax != null) ? "~" : ""}
              {ad.priceMax != null ? `$${ad.priceMax}` : ""}
            </div>
          )}
        </div>
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
        {ad.ratingCount > 0 ? (
          <span className="inline-flex items-center gap-0.5">
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" /> {ad.ratingAvg.toFixed(1)} ({ad.ratingCount})
          </span>
        ) : <span className="opacity-50">無評</span>}
        <span className="inline-flex items-center gap-1">
          <Eye className="h-2.5 w-2.5" /> {ad.viewCount}
          <Heart className="ml-1 h-2.5 w-2.5" /> {ad.favoriteCount}
        </span>
      </div>
    </Link>
  );
}
