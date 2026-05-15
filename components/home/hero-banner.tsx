"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  imageUrl?: string;       // 優先使用真實圖片
  gradientFrom?: string;
  gradientTo?: string;
  emoji?: string;
  badge?: string;          // 右上角小徽章（如「新版」「限時」）
}

interface HeroBannerProps {
  slides: HeroSlide[];
  autoPlayMs?: number;
}

export function HeroBanner({ slides, autoPlayMs = 6000 }: HeroBannerProps) {
  const [idx, setIdx] = useState(0);
  const n = slides.length;

  useEffect(() => {
    if (n <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % n), autoPlayMs);
    return () => clearInterval(t);
  }, [n, autoPlayMs]);

  if (n === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl h-[140px] sm:h-[220px] md:h-[320px]">
      {slides.map((s, i) => {
        const bgStyle = s.imageUrl
          ? { backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%), url(${s.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { backgroundImage: `linear-gradient(135deg, ${s.gradientFrom ?? "#6366f1"}, ${s.gradientTo ?? "#ec4899"})` };
        return (
          <Link
            key={s.id}
            href={s.href}
            className={cn(
              "absolute inset-0 flex flex-col items-start justify-end p-4 sm:p-6 md:p-10 transition-opacity duration-700",
              i === idx ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            style={bgStyle}
          >
            {s.badge && (
              <span className="absolute right-3 top-3 rounded-full bg-rose-500 px-3 py-1 text-xs font-extrabold text-white shadow-md ring-2 ring-white sm:right-4 sm:top-4 sm:px-3.5 sm:py-1.5 sm:text-sm">
                {s.badge}
              </span>
            )}
            {s.emoji && !s.imageUrl && (
              <div className="mb-1 text-4xl drop-shadow-lg sm:mb-2 sm:text-5xl md:text-6xl">{s.emoji}</div>
            )}
            <h2 className="text-xl font-bold leading-tight text-white drop-shadow-lg sm:text-2xl md:text-4xl">
              {s.title}
            </h2>
            {s.subtitle && (
              <p className="mt-1 line-clamp-2 max-w-xl text-sm text-white/90 drop-shadow-md sm:mt-2 sm:line-clamp-none sm:text-sm md:text-base">
                {s.subtitle}
              </p>
            )}
          </Link>
        );
      })}

      {n > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIdx((i) => (i - 1 + n) % n)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60"
            aria-label="上一張"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setIdx((i) => (i + 1) % n)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60"
            aria-label="下一張"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === idx ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                )}
                aria-label={`切換到第 ${i + 1} 張`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * JKF 風格雙 banner — 兩個半寬並排，桌面用，手機 stack
 */
interface DualHeroProps {
  left: HeroSlide;
  right: HeroSlide;
}

export function DualHeroBanner({ left, right }: DualHeroProps) {
  const renderSide = (s: HeroSlide) => {
    const bgStyle = s.imageUrl
      ? { backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.7) 100%), url(${s.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
      : { backgroundImage: `linear-gradient(135deg, ${s.gradientFrom ?? "#7c3aed"}, ${s.gradientTo ?? "#db2777"})` };
    return (
      <Link
        key={s.id}
        href={s.href}
        className="group relative flex h-[140px] flex-col items-start justify-end overflow-hidden rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-xl sm:h-[200px] sm:p-5"
        style={bgStyle}
      >
        {s.badge && (
          <span className="absolute right-3 top-3 rounded-full bg-rose-500 px-3 py-1 text-xs font-extrabold text-white shadow ring-2 ring-white">
            {s.badge}
          </span>
        )}
        <h3 className="text-lg font-bold text-white drop-shadow-md sm:text-2xl">
          {s.title}
        </h3>
        {s.subtitle && (
          <p className="mt-1 text-sm text-white/85 drop-shadow">{s.subtitle}</p>
        )}
      </Link>
    );
  };
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {renderSide(left)}
      {renderSide(right)}
    </div>
  );
}
