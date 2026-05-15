/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Wallet, Eye, Heart, Plus } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function BusinessDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const merchantId = session.user.id;

  const [wallet, ads, totalAds, activeAds, pendingAds, recentTx, me] = await Promise.all([
    db.businessWallet.findUnique({ where: { merchantId } }),
    db.businessAd.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.businessAd.count({ where: { merchantId } }),
    db.businessAd.count({ where: { merchantId, status: "ACTIVE" } }),
    db.businessAd.count({ where: { merchantId, status: "PENDING" } }),
    db.businessWalletTx.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.user.findUnique({ where: { id: merchantId }, select: { merchantVerified: true } }),
  ]);

  const balance = wallet?.balance ?? 0;
  const onboardSteps: { done: boolean; label: string; href: string }[] = [
    { done: balance > 0, label: "錢包儲值（才能刊登付費等級）", href: "/business/wallet" },
    { done: !!me?.merchantVerified, label: "完成 KYC 認證（獲得認證徽章）", href: "/business/settings" },
    { done: totalAds > 0, label: "發布第一則廣告", href: "/business/ads/new" },
  ];
  const allDone = onboardSteps.every((s) => s.done);

  // 廣告總覽
  const aggViews = ads.reduce((s, a) => s + a.viewCount, 0);
  const aggFavorites = ads.reduce((s, a) => s + a.favoriteCount, 0);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">🏢 業者儀表板</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          管理您的廣告、錢包與成效
        </p>
      </header>

      {!allDone && (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <h2 className="font-bold text-amber-300">🚀 開通 3 步驟</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {onboardSteps.map((s, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    s.done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                  }`}>{s.done ? "✓" : i + 1}</span>
                  <span className={s.done ? "text-muted-foreground line-through" : ""}>{s.label}</span>
                </span>
                {!s.done && (
                  <Link href={s.href} className="text-xs text-primary hover:underline">前往 →</Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 統計卡 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border-2 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-4">
          <p className="text-sm font-semibold text-foreground/70">論壇點數</p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-500 dark:text-emerald-400">
            {formatNumber(wallet?.balance ?? 0)} 點
          </p>
          <Link href="/business/wallet" className="mt-2 inline-block rounded-md py-1.5 text-sm font-semibold text-primary hover:underline">
            前往充點 →
          </Link>
        </div>
        <div className="rounded-xl border-2 bg-card p-4">
          <p className="text-sm font-semibold text-foreground/70">廣告總數</p>
          <p className="mt-2 text-3xl font-extrabold">{totalAds}</p>
          <p className="mt-1 text-sm text-foreground/70">
            上架中 {activeAds} · 待審 {pendingAds}
          </p>
        </div>
        <div className="rounded-xl border-2 bg-card p-4">
          <p className="text-sm font-semibold text-foreground/70">
            <Eye className="inline h-4 w-4" /> 累積瀏覽
          </p>
          <p className="mt-2 text-3xl font-extrabold">{formatNumber(aggViews)}</p>
        </div>
        <div className="rounded-xl border-2 bg-card p-4">
          <p className="text-sm font-semibold text-foreground/70">
            <Heart className="inline h-4 w-4" /> 累積收藏
          </p>
          <p className="mt-2 text-3xl font-extrabold">{formatNumber(aggFavorites)}</p>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/business/ads/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          發布新廣告
        </Link>
        <Link
          href="/business/wallet"
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-muted"
        >
          <Wallet className="h-4 w-4" />
          錢包儲值
        </Link>
      </div>

      {/* 最近廣告 */}
      <section className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">📋 最近廣告</h2>
          <Link href="/business/ads" className="rounded-md py-1.5 text-sm font-semibold text-primary hover:underline">
            全部廣告 →
          </Link>
        </div>
        {ads.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            還沒有廣告。<Link href="/business/ads/new" className="text-primary hover:underline">立即發布</Link>
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {ads.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 border-b pb-2 last:border-0">
                <div className="min-w-0 flex-1">
                  <Link href={`/business/ads/${a.id}`} className="truncate font-medium hover:text-primary">
                    {a.title}
                  </Link>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {a.city} · {a.district} · {a.tier}
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${statusColor(a.status)}`}>
                  {statusLabel(a.status)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 最近交易 */}
      <section className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">💰 最近錢包交易</h2>
          <Link href="/business/wallet" className="text-xs text-primary hover:underline">
            完整紀錄 →
          </Link>
        </div>
        {recentTx.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">無交易紀錄</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {recentTx.map((t) => (
              <li key={t.id} className="flex items-center justify-between text-xs">
                <span>
                  {txLabel(t.type)} {t.note ? `· ${t.note}` : ""}
                </span>
                <span className={t.amount > 0 ? "text-emerald-400" : "text-rose-400"}>
                  {t.amount > 0 ? "+" : ""}NT$ {formatNumber(Math.abs(t.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
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
    DRAFT: "草稿", PENDING: "待審",
    ACTIVE: "上架中", REJECTED: "退回",
    EXPIRED: "已過期", TAKEN_DOWN: "已下架", REMOVED: "已移除",
  }[s] ?? s;
}
function txLabel(t: string): string {
  return {
    DEPOSIT: "💵 儲值", AD_PAYMENT: "📣 廣告扣款",
    REFUND: "💰 退款", WITHDRAWAL: "🏦 提現",
    ADMIN_ADJUST: "⚙️ 管理調整",
  }[t] ?? t;
}
