/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Plus, Eye, Heart, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function BusinessAdsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const ads = await db.businessAd.findMany({
    where: { merchantId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  const forums = ads.length
    ? await db.forum.findMany({
        where: { id: { in: Array.from(new Set(ads.map((a) => a.forumId))) } },
        select: { id: true, name: true, slug: true },
      })
    : [];
  const forumMap = new Map(forums.map((f) => [f.id, f]));

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">📣 我的文章</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            共 {ads.length} 則 · 上架中 {ads.filter(a => a.status === "ACTIVE").length} · 點「🔗 看前台」可直達公開頁
          </p>
        </div>
        <Link
          href="/business/ads/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          發新文章
        </Link>
      </header>

      {ads.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">還沒有任何廣告</p>
          <Link
            href="/business/ads/new"
            className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            建立第一則廣告
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ads.map((a) => (
            <div
              key={a.id}
              className="group relative rounded-xl border bg-card p-3 hover:border-primary"
            >
              {/* 看前台（僅 ACTIVE 顯示）— 顯眼右上角 */}
              {a.status === "ACTIVE" && (
                <Link
                  href={`/listing/ad/${a.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-2 top-2 z-20 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-md ring-2 ring-white hover:bg-emerald-600"
                  title="在新分頁開前台公開頁面"
                >
                  <ExternalLink className="h-3 w-3" />
                  看前台
                </Link>
              )}

              <Link href={`/business/ads/${a.id}`} className="block">
                <div className="aspect-[9/16] overflow-hidden rounded-lg bg-muted">
                  {a.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.coverImageUrl} alt={a.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      無封面
                    </div>
                  )}
                </div>
                <div className="mt-3 space-y-1">
                  <p className="line-clamp-1 font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {forumMap.get(a.forumId)?.name ?? "—"} · {a.city} {a.district}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className={`rounded-full px-2 py-0.5 ${statusColor(a.status)}`}>
                      {statusLabel(a.status)}
                    </span>
                    <span className="text-muted-foreground">{a.tier}</span>
                  </div>
                  <div className="flex gap-3 pt-1 text-xs text-muted-foreground">
                    <span><Eye className="inline h-3 w-3" /> {a.viewCount}</span>
                    <span><Heart className="inline h-3 w-3" /> {a.favoriteCount}</span>
                    <span className="ml-auto">{formatDate(a.createdAt)}</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function statusColor(s: string): string {
  return {
    DRAFT: "bg-zinc-500/10 text-zinc-400",
    PENDING: "bg-amber-500/10 text-amber-400",
    ACTIVE: "bg-emerald-500/10 text-emerald-400",
    REJECTED: "bg-rose-500/10 text-rose-400",
    EXPIRED: "bg-zinc-500/10 text-zinc-400",
    TAKEN_DOWN: "bg-zinc-500/10 text-zinc-400",
    REMOVED: "bg-rose-500/10 text-rose-400",
  }[s] ?? "bg-muted text-muted-foreground";
}
function statusLabel(s: string): string {
  return {
    DRAFT: "草稿", PENDING: "待審", ACTIVE: "上架中", REJECTED: "退回",
    EXPIRED: "已過期", TAKEN_DOWN: "已下架", REMOVED: "已移除",
  }[s] ?? s;
}
