"use client";

import { useEffect, useCallback, useRef } from "react";
import useSWR from "swr";
import { AdBanner } from "./ad-banner";
import { AdSidebar } from "./ad-sidebar";
import { AdInline } from "./ad-inline";
import { AdOverlay } from "./ad-overlay";

type AdPositionType =
  | "HOME_BANNER"
  | "SIDEBAR"
  | "POST_INLINE"
  | "OVERLAY"
  | "POPUP";

interface AdData {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: AdPositionType;
  width: number | null;
  height: number | null;
}

interface AdWrapperProps {
  position: AdPositionType;
  forumId?: string;
  /** data-vip 屬性：VIP 使用者不顯示廣告 */
  isVip?: boolean;
  className?: string;
  /** 僅對 POST_INLINE 有效，取第 N 個廣告 */
  index?: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function trackImpression(adId: string) {
  fetch(`/api/ads/${adId}/impression`, { method: "POST" }).catch(() => {});
}

function trackClick(adId: string) {
  fetch(`/api/ads/${adId}/click`, { method: "POST" }).catch(() => {});
}

export function AdWrapper({
  position,
  forumId,
  isVip = false,
  className,
  index = 0,
}: AdWrapperProps) {
  const trackedRef = useRef<Set<string>>(new Set());

  const params = new URLSearchParams({ position });
  if (forumId) params.set("forumId", forumId);

  const skipFetch = isVip && (position === "OVERLAY" || position === "POPUP");

  const { data: ads } = useSWR<AdData[]>(
    skipFetch || isVip ? null : `/api/ads?${params.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 分鐘內不重複請求
    }
  );

  const ad = ads?.[index] ?? ads?.[0];

  const handleImpression = useCallback(
    (adId: string) => {
      if (trackedRef.current.has(adId)) return;
      trackedRef.current.add(adId);
      trackImpression(adId);
    },
    []
  );

  const handleClick = useCallback((adId: string) => {
    trackClick(adId);
  }, []);

  // 非 OVERLAY 類型：mount 時自動記錄曝光
  useEffect(() => {
    if (ad && position !== "OVERLAY" && position !== "POPUP") {
      handleImpression(ad.id);
    }
  }, [ad, position, handleImpression]);

  // VIP 使用者不顯示廣告（OVERLAY/POPUP 位置完全不顯示，其他位置減少顯示）
  if (skipFetch) {
    return null;
  }

  if (!ad) return null;

  switch (position) {
    case "HOME_BANNER":
      return (
        <AdBanner
          id={ad.id}
          title={ad.title}
          imageUrl={ad.imageUrl}
          linkUrl={ad.linkUrl}
          width={ad.width}
          height={ad.height}
          onClick={handleClick}
          className={className}
        />
      );

    case "SIDEBAR":
      return (
        <AdSidebar
          id={ad.id}
          title={ad.title}
          imageUrl={ad.imageUrl}
          linkUrl={ad.linkUrl}
          width={ad.width}
          height={ad.height}
          onClick={handleClick}
          className={className}
        />
      );

    case "POST_INLINE":
      return (
        <AdInline
          id={ad.id}
          title={ad.title}
          imageUrl={ad.imageUrl}
          linkUrl={ad.linkUrl}
          width={ad.width}
          height={ad.height}
          onClick={handleClick}
          className={className}
        />
      );

    case "OVERLAY":
    case "POPUP":
      return (
        <AdOverlay
          id={ad.id}
          title={ad.title}
          imageUrl={ad.imageUrl}
          linkUrl={ad.linkUrl}
          onImpression={handleImpression}
          onClick={handleClick}
        />
      );

    default:
      return null;
  }
}
