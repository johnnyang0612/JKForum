"use client";

import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface AdBannerProps {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  width?: number | null;
  height?: number | null;
  onImpression?: (adId: string) => void;
  onClick?: (adId: string) => void;
  className?: string;
}

export function AdBanner({
  id,
  title,
  imageUrl,
  linkUrl,
  className,
  onClick,
}: AdBannerProps) {
  const handleClick = () => {
    onClick?.(id);
  };

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg border bg-muted",
        className
      )}
    >
      {/* 廣告標籤 */}
      <span className="absolute left-2 top-2 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
        廣告
      </span>

      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={handleClick}
        className="block w-full"
        aria-label={title}
      >
        <div className="relative aspect-[4/1] w-full sm:aspect-[5/1]">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            className="object-cover"
            priority
          />
        </div>
      </a>
    </div>
  );
}
