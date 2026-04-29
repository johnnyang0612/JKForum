"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { formatNumber, timeAgo } from "@/lib/utils/format";
import type { FeedCardPost } from "./feed-card";

interface Props {
  title: string;
  emoji?: string;
  posts: FeedCardPost[];
  moreHref?: string;
  badge?: string;
}

export function HorizontalFeed({ title, emoji, posts, moreHref, badge }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (posts.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  return (
    <section className="space-y-3">
      <header className="flex items-end justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
          {emoji && <span className="text-2xl">{emoji}</span>}
          {title}
          {badge && (
            <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-medium text-white">
              {badge}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-1">
          {moreHref && (
            <Link
              href={moreHref}
              className="mr-2 text-sm text-muted-foreground hover:text-primary"
            >
              看更多 →
            </Link>
          )}
          <button
            onClick={() => scroll("left")}
            className="rounded-full border bg-card p-1.5 transition hover:bg-muted"
            aria-label="向左捲動"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="rounded-full border bg-card p-1.5 transition hover:bg-muted"
            aria-label="向右捲動"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scroll-smooth pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {posts.map((p) => {
          const href = `/posts/${p.id}`;
          const heat = Math.floor(p.likeCount + p.replyCount * 2 + p.viewCount / 10);
          return (
            <Link
              key={p.id}
              href={href}
              className="group relative flex-none w-[260px] overflow-hidden rounded-xl border bg-card transition hover:-translate-y-0.5 hover:shadow-lg sm:w-[300px]"
            >
              <div
                className="relative h-44 bg-cover bg-center"
                style={{
                  backgroundImage: p.coverImageUrl
                    ? `url(${p.coverImageUrl})`
                    : "linear-gradient(135deg, #7c3aed, #db2777)",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                {heat > 50 && (
                  <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-rose-500/90 px-2 py-0.5 text-xs font-bold text-white shadow">
                    <Flame className="h-3 w-3" />
                    {formatNumber(heat)}
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="line-clamp-2 min-h-[2.5em] text-sm font-bold leading-tight">
                  {p.title}
                </h3>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">@{p.author.displayName}</span>
                  <span>{timeAgo(p.createdAt)}</span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatNumber(p.viewCount)} 閱讀</span>
                  <span>{p.replyCount} 回覆</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
