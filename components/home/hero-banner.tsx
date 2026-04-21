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
  gradientFrom: string;
  gradientTo: string;
  emoji?: string;
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
    <div className="relative overflow-hidden rounded-2xl h-[180px] sm:h-[240px] md:h-[280px]">
      {slides.map((s, i) => (
        <Link
          key={s.id}
          href={s.href}
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center text-center p-6 transition-opacity duration-700",
            i === idx ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          style={{
            backgroundImage: `linear-gradient(135deg, ${s.gradientFrom}, ${s.gradientTo})`,
          }}
        >
          {s.emoji && (
            <div className="text-5xl sm:text-6xl mb-2 drop-shadow-lg">
              {s.emoji}
            </div>
          )}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-md">
            {s.title}
          </h2>
          {s.subtitle && (
            <p className="mt-2 text-sm sm:text-base text-white/90 max-w-lg">
              {s.subtitle}
            </p>
          )}
        </Link>
      ))}

      {n > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIdx((i) => (i - 1 + n) % n)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition"
            aria-label="上一張"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setIdx((i) => (i + 1) % n)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition"
            aria-label="下一張"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
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
