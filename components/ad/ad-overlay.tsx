"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface AdOverlayProps {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  onImpression?: (adId: string) => void;
  onClick?: (adId: string) => void;
}

const OVERLAY_SESSION_KEY = "jkf_overlay_ad_shown";

export function AdOverlay({
  id,
  title,
  imageUrl,
  linkUrl,
  onImpression,
  onClick,
}: AdOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 每次 session 只顯示一次
    const shown = sessionStorage.getItem(OVERLAY_SESSION_KEY);
    if (shown) return;

    // 延遲 1.5 秒顯示
    const timer = setTimeout(() => {
      setVisible(true);
      sessionStorage.setItem(OVERLAY_SESSION_KEY, "1");
      onImpression?.(id);
    }, 1500);

    return () => clearTimeout(timer);
  }, [id, onImpression]);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  const handleClick = () => {
    onClick?.(id);
  };

  // 按 Escape 關閉
  useEffect(() => {
    if (!visible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [visible, handleClose]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="relative max-h-[80vh] max-w-lg w-full overflow-hidden rounded-xl bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 關閉按鈕 */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3 top-3 z-20 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
          aria-label="關閉廣告"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 廣告標籤 */}
        <span className="absolute left-3 top-3 z-20 rounded bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
          廣告
        </span>

        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          onClick={handleClick}
          className="block"
          aria-label={title}
        >
          <div className="relative aspect-[4/3] w-full">
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 512px) 100vw, 512px"
              className="object-cover"
              priority
            />
          </div>
          <div className="p-4 text-center">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="mt-1 text-xs text-primary">點擊了解更多</p>
          </div>
        </a>
      </div>
    </div>
  );
}
