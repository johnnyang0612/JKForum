/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { db } from "@/lib/db";
import { Download, Sparkles, Coins, Ticket, Star } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import { CreditBuyButton } from "@/components/downloads/credit-buy-button";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCredit } from "@/lib/download-engine";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "下載專區" };

const CATEGORY_LABEL: Record<string, { label: string; emoji: string; color: string }> = {
  WALLPAPER:  { label: "桌布",     emoji: "🖼️", color: "bg-blue-500/10 text-blue-400" },
  FONT:       { label: "字體",     emoji: "🔤", color: "bg-purple-500/10 text-purple-400" },
  EBOOK:      { label: "電子書",   emoji: "📚", color: "bg-emerald-500/10 text-emerald-400" },
  TOOL:       { label: "工具",     emoji: "🛠️", color: "bg-zinc-500/10 text-zinc-400" },
  AUDIO:      { label: "音樂",     emoji: "🎵", color: "bg-pink-500/10 text-pink-400" },
  VIDEO:      { label: "影片",     emoji: "🎬", color: "bg-rose-500/10 text-rose-400" },
  IMAGE_PACK: { label: "圖包",     emoji: "🎨", color: "bg-fuchsia-500/10 text-fuchsia-400" },
  GAME:       { label: "遊戲",     emoji: "🎮", color: "bg-amber-500/10 text-amber-400" },
  TEMPLATE:   { label: "範本",     emoji: "📐", color: "bg-teal-500/10 text-teal-400" },
  OTHER:      { label: "其他",     emoji: "📦", color: "bg-zinc-500/10 text-zinc-400" },
};

function fmtSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export default async function DownloadsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const cat = searchParams.category;
  const where: any = { isActive: true };
  if (cat) where.category = cat;

  const session = await getServerSession(authOptions);
  const myCredits = session?.user ? await getCredit(session.user.id) : 0;

  const [items, featured, categoryCounts] = await Promise.all([
    db.downloadResource.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { downloadCount: "desc" }],
      take: 24,
    }),
    cat
      ? Promise.resolve([])
      : db.downloadResource.findMany({
          where: { isActive: true, isFeatured: true },
          orderBy: { downloadCount: "desc" },
          take: 4,
        }),
    db.downloadResource.groupBy({
      by: ["category"],
      where: { isActive: true },
      _count: { _all: true },
    }),
  ]);

  const countMap = new Map(categoryCounts.map((c) => [c.category, c._count._all]));

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Download className="h-7 w-7 text-primary" />
            下載專區
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            桌布 / 字體 / 電子書 / 工具 / 影音 — 用下載額度或金幣兌換
          </p>
        </div>
        {session?.user && (
          <div className="flex items-center gap-2">
            <div className="rounded-lg border bg-card px-3 py-1.5 text-sm">
              <Ticket className="mr-1 inline h-4 w-4 text-emerald-400" />
              下載額度：<b>{myCredits}</b>
            </div>
            <CreditBuyButton />
          </div>
        )}
      </header>

      {/* 取得方式提示 */}
      {session?.user && myCredits < 5 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
          💡 <b>下載額度不夠？</b>方法：完成任務（DAILY +1 / NEWBIE +3 / ACHIEVEMENT +5）/ 連續簽到 / VIP 月配 / 100 金幣換 1 額度
        </div>
      )}

      {/* 分類 tabs */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/downloads"
          className={`rounded-full border px-3 py-1 text-xs transition ${
            !cat ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
          }`}
        >
          全部
        </Link>
        {Object.entries(CATEGORY_LABEL).map(([k, v]) => {
          const count = countMap.get(k as any) ?? 0;
          if (count === 0) return null;
          return (
            <Link
              key={k}
              href={`/downloads?category=${k}`}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                cat === k ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
              }`}
            >
              {v.emoji} {v.label} ({count})
            </Link>
          );
        })}
      </div>

      {/* 精選（無分類過濾時） */}
      {featured.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-1.5 font-bold">
            <Sparkles className="h-5 w-5 text-amber-400" />
            精選資源
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((it) => (
              <ResourceCard key={it.id} item={it} fmtSize={fmtSize} />
            ))}
          </div>
        </section>
      )}

      {/* 全部 */}
      <section>
        <h2 className="mb-3 font-bold">{cat ? CATEGORY_LABEL[cat]?.label : "全部資源"}（{items.length}）</h2>
        {items.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            此分類目前沒有資源
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((it) => (
              <ResourceCard key={it.id} item={it} fmtSize={fmtSize} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ResourceCard({ item, fmtSize }: { item: any; fmtSize: (n: number) => string }) {
  const cat = CATEGORY_LABEL[item.category] ?? CATEGORY_LABEL.OTHER;
  return (
    <Link
      href={`/downloads/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div
        className="relative h-32 bg-cover bg-center"
        style={{
          backgroundImage: item.thumbnailUrl
            ? `url(${item.thumbnailUrl})`
            : `linear-gradient(135deg, #6366f1, #ec4899)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] ${cat.color}`}>
          {cat.emoji} {cat.label}
        </span>
        {item.isFeatured && (
          <span className="absolute right-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
            <Star className="mr-0.5 inline h-2.5 w-2.5 fill-current" />精選
          </span>
        )}
        {item.requiresVip && (
          <span className="absolute bottom-2 right-2 rounded-full bg-fuchsia-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
            VIP
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 min-h-[2.5em] text-sm font-bold">{item.title}</h3>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{fmtSize(item.fileSize)} · {item.fileType ?? "—"}</span>
          <span>{formatNumber(item.downloadCount)} 下載</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs">
          {item.costCredits > 0 && (
            <span className="flex items-center gap-1 text-emerald-400">
              <Ticket className="h-3 w-3" />
              {item.costCredits}
            </span>
          )}
          {item.costCoins > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <Coins className="h-3 w-3" />
              {item.costCoins}
            </span>
          )}
          {item.costCredits === 0 && item.costCoins === 0 && (
            <span className="text-emerald-400 font-bold">免費</span>
          )}
        </div>
      </div>
    </Link>
  );
}
