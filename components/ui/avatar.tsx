"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

const avatarSizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
} as const;

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: keyof typeof avatarSizes;
  className?: string;
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length > 1) {
    return parts.map((p) => p.charAt(0)).slice(0, 2).join("").toUpperCase();
  }
  return Array.from(trimmed).slice(0, 2).join("").toUpperCase();
}

function Avatar({
  src,
  alt = "",
  fallback,
  size = "md",
  className,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = src && !imgError;
  const initials = fallback ? getInitials(fallback) : "?";

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-muted",
        avatarSizes[size],
        className
      )}
    >
      {showImage ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-primary/10 font-medium text-primary">
          {initials}
        </div>
      )}
    </div>
  );
}

export { Avatar };
