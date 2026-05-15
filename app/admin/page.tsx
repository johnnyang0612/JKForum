import Link from "next/link";
import { db } from "@/lib/db";
import {
  Users, Building2, DollarSign, Wallet, Tag, Star,
  PenSquare, MessageSquare, Heart, Sparkles,
} from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import { TrendChart } from "@/components/admin/trend-chart";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "管理後台 — 店家平台" };

const DAYS = 30;

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function getStats() {
  const since = new Date(Date.now() - DAYS * 86400000);

  const [
    totalUsers,
    totalBusinessUsers,
    activeUsers,
    pendingReports,

    totalAds,
    activeAds,
    pendingAds,
    paidAdsCount,
    freeAdsCount,

    pendingKyc,
    pendingWithdrawals,

    depositSum,
    depositTrendRaw,
    adRevenueSum,
    adRevenueTrendRaw,

    // 店家板塊內的互動量（30 天）
    newAds30d,
    newComments30d,
    newRatings30d,
    newFavorites30d,
    adsTrendRaw,
    commentsTrendRaw,
    ratingsTrendRaw,
    favoritesTrendRaw,

    tierDist,
    cityDist,
    topAds,
    recentBusinessUsers,
    recentAds,
    recentComments,
    recentLogs,
  ] = await Promise.all([
    db.user.count({ where: { status: "ACTIVE" } }),
    db.user.count({ where: { userType: "BUSINESS" } }),
    db.user.count({
      where: { lastLoginAt: { gte: new Date(Date.now() - 7 * 86400000) } },
    }),
    db.report.count({ where: { status: "PENDING" } }),

    db.businessAd.count(),
    db.businessAd.count({ where: { status: "ACTIVE" } }),
    db.businessAd.count({ where: { status: "PENDING" } }),
    db.businessAd.count({ where: { tier: { not: "FREE" } } }),
    db.businessAd.count({ where: { tier: "FREE" } }),

    db.user.count({
      where: {
        userType: "BUSINESS", merchantVerified: false,
        merchantVerifiedDocs: { not: [] },
      },
    }),
    db.withdrawalRequest.count({ where: { status: "PENDING" } }),

    db.businessWalletTx.aggregate({
      where: { type: "DEPOSIT", createdAt: { gte: since } },
      _sum: { amount: true },
    }),
    db.businessWalletTx.findMany({
      where: { type: "DEPOSIT", createdAt: { gte: since } },
      select: { createdAt: true, amount: true },
    }),
    db.businessAd.aggregate({
      where: { createdAt: { gte: since }, tierAmountTwd: { gt: 0 } },
      _sum: { tierAmountTwd: true },
    }),
    db.businessAd.findMany({
      where: { createdAt: { gte: since }, tierAmountTwd: { gt: 0 } },
      select: { createdAt: true, tierAmountTwd: true },
    }),

    // 店家板塊互動 — 數量
    db.businessAd.count({ where: { createdAt: { gte: since } } }),
    db.businessAdComment.count({ where: { createdAt: { gte: since }, isDeleted: false } }),
    db.businessAdRating.count({ where: { createdAt: { gte: since } } }),
    db.businessAdFavorite.count({ where: { createdAt: { gte: since } } }),

    // 店家板塊互動 — 趨勢
    db.businessAd.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    db.businessAdComment.findMany({
      where: { createdAt: { gte: since }, isDeleted: false },
      select: { createdAt: true },
    }),
    db.businessAdRating.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    db.businessAdFavorite.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),

    db.businessAd.groupBy({
      by: ["tier"],
      _count: { _all: true },
    }),
    db.businessAd.groupBy({
      by: ["city"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
      orderBy: { _count: { city: "desc" } },
      take: 10,
    }),
    db.businessAd.findMany({
      where: { status: "ACTIVE" },
      orderBy: { viewCount: "desc" },
      take: 8,
      select: {
        id: true, title: true, city: true, district: true,
        tier: true, viewCount: true, ratingAvg: true, ratingCount: true,
      },
    }),
    db.user.findMany({
      where: { userType: "BUSINESS" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true, displayName: true, username: true,
        merchantName: true, merchantVerified: true, createdAt: true,
      },
    }),
    db.businessAd.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true, title: true, city: true, district: true,
        tier: true, status: true, createdAt: true,
      },
    }),
    db.businessAdComment.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true, adId: true, content: true, createdAt: true,
        ad: { select: { title: true } },
      },
    }),
    db.adminLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { admin: { select: { displayName: true } } },
    }),
  ]);

  // 趨勢日表
  const buildAmountSeries = (rows: Array<{ createdAt: Date; amount?: number; tierAmountTwd?: number }>, field: "amount" | "tierAmountTwd") => {
    const map = new Map<string, number>();
    for (let i = DAYS - 1; i >= 0; i--) {
      map.set(dayKey(new Date(Date.now() - i * 86400000)), 0);
    }
    for (const r of rows) {
      const k = dayKey(r.createdAt);
      const v = (field === "amount" ? r.amount : r.tierAmountTwd) ?? 0;
      if (map.has(k)) map.set(k, (map.get(k) ?? 0) + v);
    }
    return Array.from(map, ([x, y]) => ({ x, y }));
  };

  const buildCountSeries = (rows: Array<{ createdAt: Date }>) => {
    const map = new Map<string, number>();
    for (let i = DAYS - 1; i >= 0; i--) {
      map.set(dayKey(new Date(Date.now() - i * 86400000)), 0);
    }
    for (const r of rows) {
      const k = dayKey(r.createdAt);
      if (map.has(k)) map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map, ([x, y]) => ({ x, y }));
  };

  return {
    totals: {
      totalUsers, totalBusinessUsers, activeUsers, pendingReports,
      totalAds, activeAds, pendingAds, paidAdsCount, freeAdsCount,
      pendingKyc, pendingWithdrawals,
      depositSum: depositSum._sum.amount ?? 0,
      adRevenueSum: adRevenueSum._sum.tierAmountTwd ?? 0,
      newAds30d, newComments30d, newRatings30d, newFavorites30d,
    },
    trends: {
      deposit: buildAmountSeries(depositTrendRaw, "amount"),
      adRevenue: buildAmountSeries(adRevenueTrendRaw, "tierAmountTwd"),
      ads: buildCountSeries(adsTrendRaw),
      comments: buildCountSeries(commentsTrendRaw),
      ratings: buildCountSeries(ratingsTrendRaw),
      favorites: buildCountSeries(favoritesTrendRaw),
    },
    tierDist,
    cityDist,
    topAds,
    recentBusinessUsers,
    recentAds,
    recentComments,
    recentLogs,
  };
}

const TIER_LABEL: Record<string, { label: string; color: string }> = {
  T3000: { label: "🔥 T3000", color: "bg-amber-500" },
  T2000: { label: "⭐ T2000", color: "bg-fuchsia-500" },
  T1000: { label: "👑 T1000", color: "bg-rose-500" },
  T500:  { label: "🌟 T500",  color: "bg-blue-500" },
  FREE:  { label: "免費",     color: "bg-zinc-400" },
};

export default async function AdminDashboard() {
  const data = await getStats();
  const t = data.totals;

  // KPI 第一排：營運／待辦
  const opsCards = [
    { label: "業者數", value: t.totalBusinessUsers, sub: `週活躍 ${t.activeUsers}`, icon: Building2, color: "text-blue-500", bg: "from-blue-500/20 to-blue-500/5" },
    { label: "上架中廣告", value: t.activeAds, sub: `總數 ${t.totalAds}`, icon: Tag, color: "text-emerald-500", bg: "from-emerald-500/20 to-emerald-500/5" },
    { label: "30 天儲值", value: t.depositSum, prefix: "$", sub: "業者錢包", icon: Wallet, color: "text-amber-500", bg: "from-amber-500/20 to-amber-500/5" },
    { label: "30 天廣告收入", value: t.adRevenueSum, prefix: "$", sub: "Tier 扣款", icon: DollarSign, color: "text-emerald-500", bg: "from-emerald-500/20 to-emerald-500/5" },
  ];

  // KPI 第二排：店家板塊互動（廣告 = 發文 / 留言 = 回覆 / 收藏 = 讚 / 評分）
  const interactionCards = [
    { label: "30 天新刊登", value: t.newAds30d, sub: "廣告 = 發文", icon: PenSquare, color: "text-indigo-500", bg: "from-indigo-500/20 to-indigo-500/5" },
    { label: "30 天留言", value: t.newComments30d, sub: "廣告留言 = 回覆", icon: MessageSquare, color: "text-violet-500", bg: "from-violet-500/20 to-violet-500/5" },
    { label: "30 天收藏", value: t.newFavorites30d, sub: "❤ 等同站內讚", icon: Heart, color: "text-rose-500", bg: "from-rose-500/20 to-rose-500/5" },
    { label: "30 天評分", value: t.newRatings30d, sub: "1-5 顆星評", icon: Star, color: "text-amber-500", bg: "from-amber-500/20 to-amber-500/5" },
  ];

  const tierTotal = data.tierDist.reduce((s, x) => s + x._count._all, 0);
  const cityMax = data.cityDist[0]?._count._all ?? 1;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">📊 店家平台儀表板</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          過去 30 天總覽 · 共 {formatNumber(t.totalUsers)} 位站內會員（含 {formatNumber(t.totalBusinessUsers)} 位業者）
        </p>
      </header>

      {/* === 營運 KPI === */}
      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">營運</h2>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {opsCards.map((c) => (
            <KpiCard key={c.label} {...c} />
          ))}
        </div>
      </div>

      {/* === 店家板塊互動 KPI（發文/回覆/讚/評分） === */}
      <div>
        <h2 className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          店家板塊互動（30 天）
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {interactionCards.map((c) => (
            <KpiCard key={c.label} {...c} />
          ))}
        </div>
      </div>

      {/* === 待辦快速跳轉 === */}
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <QuickLink href="/admin/business-ads" label="廣告審核" badge={t.pendingAds} />
        <QuickLink href="/admin/business-kyc" label="KYC 審核" badge={t.pendingKyc} />
        <QuickLink href="/admin/withdrawals" label="提領審核" badge={t.pendingWithdrawals} />
        <QuickLink href="/admin/reports" label="檢舉處理" badge={t.pendingReports} />
      </section>

      {/* === 收入趨勢 === */}
      <section>
        <h2 className="mb-3 text-lg font-bold">📈 30 天收入</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TrendChart title="儲值收入 (NT$)" color="#fbbf24" data={data.trends.deposit} />
          <TrendChart title="廣告 Tier 收入 (NT$)" color="#10b981" data={data.trends.adRevenue} />
        </div>
      </section>

      {/* === 互動趨勢（4 圖） === */}
      <section>
        <h2 className="mb-3 text-lg font-bold">📊 30 天店家板塊互動趨勢</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TrendChart title="新刊登廣告（發文）" color="#6366f1" data={data.trends.ads} />
          <TrendChart title="廣告留言（回覆）" color="#8b5cf6" data={data.trends.comments} />
          <TrendChart title="收藏（讚）" color="#f43f5e" data={data.trends.favorites} />
          <TrendChart title="評分" color="#f59e0b" data={data.trends.ratings} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Tier 分布 */}
        <section className="rounded-xl border bg-card p-5">
          <h3 className="mb-3 font-bold">🏆 廣告 Tier 分布</h3>
          <div className="space-y-2">
            {data.tierDist.map((row) => {
              const cfg = TIER_LABEL[row.tier] ?? { label: row.tier, color: "bg-zinc-500" };
              const pct = tierTotal > 0 ? (row._count._all / tierTotal) * 100 : 0;
              return (
                <div key={row.tier} className="text-xs">
                  <div className="flex items-center justify-between">
                    <span>{cfg.label}</span>
                    <span className="text-muted-foreground">
                      {row._count._all} <span className="opacity-50">({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="mt-0.5 h-1.5 overflow-hidden rounded bg-muted">
                    <div className={`h-full ${cfg.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="mt-2 border-t pt-2 text-xs text-muted-foreground">
              付費比 = <strong className="text-foreground">{t.paidAdsCount}</strong> 付費 / <strong>{t.freeAdsCount}</strong> 免費
            </div>
          </div>
        </section>

        {/* 城市分布 TOP 10 */}
        <section className="rounded-xl border bg-card p-5">
          <h3 className="mb-3 font-bold">📍 城市分布（上架中 TOP 10）</h3>
          <ol className="space-y-1.5 text-sm">
            {data.cityDist.map((c, i) => {
              const pct = (c._count._all / cityMax) * 100;
              const medal = ["🥇", "🥈", "🥉"][i] ?? `${i + 1}.`;
              return (
                <li key={c.city} className="text-xs">
                  <Link href={`/?city=${encodeURIComponent(c.city)}`} className="flex items-center justify-between hover:text-primary">
                    <span className="flex items-center gap-1.5">
                      <span>{medal}</span>
                      {c.city || "（未填）"}
                    </span>
                    <span className="text-muted-foreground">{c._count._all}</span>
                  </Link>
                  <div className="mt-0.5 h-1 overflow-hidden rounded bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
            {data.cityDist.length === 0 && (
              <li className="text-xs text-muted-foreground">尚無上架中的廣告</li>
            )}
          </ol>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 熱門廣告 TOP 8 */}
        <section className="rounded-xl border bg-card p-3 sm:p-5">
          <h3 className="mb-3 font-bold">🔥 熱門廣告 TOP 8</h3>
          <ul className="space-y-2 text-sm">
            {data.topAds.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2">
                <Link href={`/listing/ad/${a.id}`} className="min-w-0 flex-1 truncate hover:text-primary">
                  <span className="font-medium">{a.title}</span>
                  <span className="ml-1.5 text-[10px] text-muted-foreground">{a.city} {a.district}</span>
                </Link>
                <span className="flex flex-none items-center gap-2 whitespace-nowrap text-xs text-muted-foreground">
                  {a.ratingCount > 0 && (
                    <span className="inline-flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {a.ratingAvg.toFixed(1)}
                    </span>
                  )}
                  <span>{formatNumber(a.viewCount)} 閱</span>
                </span>
              </li>
            ))}
            {data.topAds.length === 0 && <li className="text-xs text-muted-foreground">尚無上架中的廣告</li>}
          </ul>
        </section>

        {/* 最新刊登 TOP 8 */}
        <section className="rounded-xl border bg-card p-3 sm:p-5">
          <h3 className="mb-3 flex items-center gap-1 font-bold">
            <PenSquare className="h-4 w-4" /> 最新刊登（含未審）
          </h3>
          <ul className="space-y-2 text-sm">
            {data.recentAds.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2">
                <Link href={`/listing/ad/${a.id}`} className="min-w-0 flex-1 truncate hover:text-primary">
                  <span className="font-medium">{a.title}</span>
                  <span className="ml-1.5 text-[10px] text-muted-foreground">{a.city} {a.district}</span>
                  <StatusPill status={a.status} />
                </Link>
                <span className="flex-none whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(a.createdAt).toLocaleDateString("zh-TW", { month: "2-digit", day: "2-digit" })}
                </span>
              </li>
            ))}
            {data.recentAds.length === 0 && <li className="text-xs text-muted-foreground">無</li>}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 最新留言 */}
        <section className="rounded-xl border bg-card p-3 sm:p-5">
          <h3 className="mb-3 flex items-center gap-1 font-bold">
            <MessageSquare className="h-4 w-4" /> 最新廣告留言
          </h3>
          <ul className="space-y-2 text-sm">
            {data.recentComments.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2">
                <Link href={`/listing/ad/${c.adId}#comments`} className="min-w-0 flex-1 truncate hover:text-primary">
                  <span className="text-xs text-muted-foreground">[{c.ad?.title?.slice(0, 14)}]</span>
                  <span className="ml-1">{c.content.slice(0, 30)}{c.content.length > 30 ? "…" : ""}</span>
                </Link>
                <span className="flex-none whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString("zh-TW", { month: "2-digit", day: "2-digit" })}
                </span>
              </li>
            ))}
            {data.recentComments.length === 0 && <li className="text-xs text-muted-foreground">無</li>}
          </ul>
        </section>

        {/* 最近業者 */}
        <section className="rounded-xl border bg-card p-3 sm:p-5">
          <h3 className="mb-3 flex items-center gap-1 font-bold">
            <Users className="h-4 w-4" /> 最近註冊業者
          </h3>
          <ul className="space-y-2 text-sm">
            {data.recentBusinessUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-2">
                <Link href={`/profile/${u.id}`} className="min-w-0 flex-1 truncate hover:text-primary">
                  <span className="font-medium">{u.merchantName ?? u.displayName}</span>
                  <span className="ml-1 text-xs text-muted-foreground">@{u.username}</span>
                  {u.merchantVerified ? (
                    <span className="ml-1.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">已認證</span>
                  ) : (
                    <span className="ml-1.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-600 dark:text-amber-400">未認證</span>
                  )}
                </Link>
                <span className="flex-none text-xs text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString("zh-TW", { month: "2-digit", day: "2-digit" })}
                </span>
              </li>
            ))}
            {data.recentBusinessUsers.length === 0 && <li className="text-xs text-muted-foreground">無</li>}
          </ul>
        </section>
      </div>

      {/* 最近管理操作 */}
      <section className="rounded-xl border bg-card p-3 sm:p-5">
        <div className="mb-3 flex items-end justify-between">
          <h3 className="font-bold">⚡ 最近管理操作</h3>
          <Link href="/admin/logs" className="text-xs text-muted-foreground hover:text-primary">
            完整日誌 →
          </Link>
        </div>
        <ul className="space-y-1 text-sm">
          {data.recentLogs.map((log) => (
            <li
              key={log.id}
              className="flex items-center justify-between rounded px-2 py-1 hover:bg-muted/50"
            >
              <span className="text-xs">
                <b>{log.admin.displayName}</b>{" "}
                <span className="text-muted-foreground">{log.action}</span>{" "}
                <code className="text-[10px] opacity-60">
                  {log.targetType.toLowerCase()} / {log.targetId.slice(0, 8)}…
                </code>
              </span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(log.createdAt).toLocaleString("zh-TW", {
                  month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </li>
          ))}
          {data.recentLogs.length === 0 && <li className="text-xs text-muted-foreground">無記錄</li>}
        </ul>
      </section>

      {/* 待辦剩餘 — pendingReports / pendingKyc / pendingWithdrawals 已在 QuickLink，這裡再補一行附註 */}
      <p className="px-1 text-[11px] text-muted-foreground">
        Pending：{t.pendingAds} 廣告 · {t.pendingKyc} KYC · {t.pendingWithdrawals} 提領 · {t.pendingReports} 檢舉
      </p>
    </div>
  );
}

function KpiCard({
  label, value, sub, icon: Icon, color, bg, prefix,
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  prefix?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${bg} p-3 sm:p-4`}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${color}`} />
      </div>
      <p className="mt-2 text-2xl font-bold sm:text-3xl">
        {prefix ?? ""}{formatNumber(value)}
      </p>
      <p className="mt-0.5 truncate text-[10px] text-muted-foreground sm:text-xs">{sub}</p>
    </div>
  );
}

function QuickLink({ href, label, badge }: { href: string; label: string; badge: number }) {
  const urgent = badge > 0;
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
        urgent
          ? "border-rose-500/40 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400"
          : "bg-card hover:bg-muted"
      }`}
    >
      <span>{label}</span>
      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
        urgent ? "bg-rose-500 text-white" : "bg-muted text-muted-foreground"
      }`}>
        {badge}
      </span>
    </Link>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ACTIVE:    { label: "上架", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    PENDING:   { label: "待審", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    DRAFT:     { label: "草稿", cls: "bg-zinc-500/15 text-zinc-500" },
    REJECTED:  { label: "退回", cls: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
    EXPIRED:   { label: "到期", cls: "bg-zinc-500/15 text-zinc-500" },
    PAUSED:    { label: "暫停", cls: "bg-zinc-500/15 text-zinc-500" },
  };
  const m = map[status] ?? { label: status, cls: "bg-zinc-500/15 text-zinc-500" };
  return (
    <span className={`ml-1.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] ${m.cls}`}>
      {m.label}
    </span>
  );
}
