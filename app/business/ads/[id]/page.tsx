/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Eye, Heart, MousePointerClick, MessageCircle } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/utils/format";
import { AdActions } from "@/components/business/ad-actions";

export const dynamic = "force-dynamic";

export default async function AdDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const ad = await db.businessAd.findUnique({ where: { id: params.id } });
  if (!ad || ad.merchantId !== session.user.id) notFound();

  const forum = await db.forum.findUnique({ where: { id: ad.forumId }, select: { name: true, slug: true } });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Link href="/business/ads" className="text-xs text-muted-foreground hover:text-primary">← 我的廣告</Link>
      </div>

      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{ad.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {forum?.name} · {ad.city} {ad.district} · {ad.tier} · 建立 {formatDate(ad.createdAt)}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs ${statusColor(ad.status)}`}>
          {statusLabel(ad.status)}
        </span>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="aspect-[9/16] overflow-hidden rounded-2xl border bg-muted">
          {ad.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ad.coverImageUrl} alt={ad.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">無封面</div>
          )}
        </div>

        <div className="space-y-3 text-sm">
          <section className="rounded-xl border bg-card p-4">
            <h3 className="font-bold">📋 簡介</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{ad.description}</p>
          </section>

          {(ad.priceMin != null || ad.priceMax != null) && (
            <section className="rounded-xl border bg-card p-4">
              <h3 className="font-bold">💵 價格</h3>
              <p className="mt-2 text-sm">
                {ad.priceMin != null ? `NT$ ${formatNumber(ad.priceMin)}` : "—"}
                {" ~ "}
                {ad.priceMax != null ? `NT$ ${formatNumber(ad.priceMax)}` : "—"}
              </p>
            </section>
          )}

          {Array.isArray(ad.tags) && (ad.tags as string[]).length > 0 && (
            <section className="rounded-xl border bg-card p-4">
              <h3 className="font-bold">🏷️ 標籤</h3>
              <div className="mt-2 flex flex-wrap gap-1">
                {(ad.tags as string[]).map((t) => (
                  <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs">{t}</span>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-xl border bg-card p-4">
            <h3 className="font-bold">📊 即時數據</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <Stat icon={<Eye />} label="瀏覽" value={formatNumber(ad.viewCount)} />
              <Stat icon={<MousePointerClick />} label="點擊" value={formatNumber(ad.clickCount)} />
              <Stat icon={<Heart />} label="收藏" value={formatNumber(ad.favoriteCount)} />
              <Stat icon={<MessageCircle />} label="聯絡" value={formatNumber(ad.contactCount)} />
            </div>
          </section>

          {ad.expiresAt && (
            <section className="rounded-xl border bg-card p-4 text-xs">
              <p className="text-muted-foreground">到期時間</p>
              <p className="mt-1 font-medium">{formatDate(ad.expiresAt)}（{daysLeft(ad.expiresAt)} 天後）</p>
            </section>
          )}

          {ad.rejectReason && (
            <section className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-xs">
              <p className="font-bold text-rose-400">退審原因</p>
              <p className="mt-1 text-rose-300">{ad.rejectReason}</p>
            </section>
          )}

          <AdActions adId={ad.id} status={ad.status} />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/30 p-2">
      <div className="flex items-center gap-1 text-muted-foreground">
        <span className="[&_svg]:h-3 [&_svg]:w-3">{icon}</span>
        {label}
      </div>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}
function daysLeft(d: Date): number {
  return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));
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
