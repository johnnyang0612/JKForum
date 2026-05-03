/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { db } from "@/lib/db";
import { Megaphone, ChevronRight } from "lucide-react";

const TIER_RANK: Record<string, number> = { T3000: 5, T2000: 4, T1000: 3, T500: 2, FREE: 1 };

export async function ForumAdStrip({ forumId }: { forumId: string }) {
  const ads = await db.businessAd.findMany({
    where: { forumId, status: "ACTIVE" },
    orderBy: [{ tier: "desc" }, { sortWeight: "desc" }],
    take: 8,
  });
  if (ads.length === 0) return null;
  ads.sort((a, b) => (TIER_RANK[b.tier] - TIER_RANK[a.tier]) || (b.sortWeight - a.sortWeight));

  return (
    <section className="rounded-xl border bg-gradient-to-br from-amber-500/5 via-transparent to-transparent p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-bold">
          <Megaphone className="h-4 w-4 text-amber-400" />
          特約店家
        </h3>
        <Link href={`/listing?forum=${forumId}`} className="flex items-center gap-0.5 text-xs text-primary hover:underline">
          看全部 <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {ads.map((a) => (
          <Link key={a.id} href={`/listing/ad/${a.id}`} className="group block w-24 shrink-0">
            <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-muted">
              {a.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.coverImageUrl} alt={a.title} loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl">🏪</div>
              )}
              {a.tier !== "FREE" && (
                <span className="absolute left-1 top-1 rounded bg-amber-500/90 px-1 py-0.5 text-[9px] font-bold text-zinc-900">
                  {a.tier === "T3000" ? "🔥" : a.tier === "T2000" ? "⭐" : a.tier === "T1000" ? "👑" : "🌟"}
                </span>
              )}
            </div>
            <p className="mt-1 line-clamp-1 text-[10px] font-medium">{a.title}</p>
            <p className="text-[9px] text-muted-foreground">{a.city}{a.district}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
