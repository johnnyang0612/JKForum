import Link from "next/link";
import { db } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { formatNumber } from "@/lib/utils/format";
import { getLevelByIndex } from "@/lib/constants/levels";
import { Trophy, Coins, Flame, MessageSquare, Gift, Calendar, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export const metadata: Metadata = {
  title: "排行榜",
  description: "JKForum 社群排行榜 — 看看誰最活躍、最受歡迎",
};

type Tab = "reputation" | "coins" | "posts" | "likes" | "checkin" | "tips";

interface Props {
  searchParams: { tab?: Tab };
}

type Row = Record<string, unknown> & {
  userId: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string | null;
  level?: number;
};

async function getSnapshot(type: Tab): Promise<{ rows: Row[]; refreshedAt: Date } | null> {
  const snap = await db.leaderboardSnapshot.findUnique({ where: { type } });
  if (!snap) return null;
  return {
    rows: (snap.rows as unknown as Row[]) || [],
    refreshedAt: snap.refreshedAt,
  };
}

const TABS: Array<{
  key: Tab;
  label: string;
  icon: typeof Trophy;
  color: string;
}> = [
  { key: "reputation", label: "名聲榜", icon: Trophy, color: "text-red-500" },
  { key: "coins", label: "金幣榜", icon: Coins, color: "text-amber-500" },
  { key: "posts", label: "發文榜", icon: MessageSquare, color: "text-emerald-500" },
  { key: "likes", label: "人氣榜", icon: Flame, color: "text-orange-500" },
  { key: "checkin", label: "簽到榜", icon: Calendar, color: "text-blue-500" },
  { key: "tips", label: "打賞榜", icon: Gift, color: "text-pink-500" },
];

function MedalNum({ rank }: { rank: number }) {
  const color =
    rank === 1
      ? "bg-gradient-to-br from-yellow-300 to-yellow-600 text-white"
      : rank === 2
      ? "bg-gradient-to-br from-slate-300 to-slate-500 text-white"
      : rank === 3
      ? "bg-gradient-to-br from-amber-500 to-amber-800 text-white"
      : "bg-muted text-muted-foreground";
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
        color
      )}
    >
      {rank}
    </div>
  );
}

function RankRow({
  rank,
  row,
  primary,
  secondary,
}: {
  rank: number;
  row: Row;
  primary: string;
  secondary?: string;
}) {
  const level = row.level != null ? getLevelByIndex(row.level) : null;
  return (
    <Link
      href={`/profile/${row.userId}`}
      className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary/30 hover:bg-muted/30"
    >
      <MedalNum rank={rank} />
      <Avatar
        src={row.avatarUrl || null}
        fallback={row.displayName || row.username || "?"}
        size="md"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{row.displayName || row.username}</span>
          {level && (
            <span
              className="rounded px-1 text-[10px] font-bold"
              style={{ color: level.color }}
            >
              {level.name}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">@{row.username}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-bold">{primary}</div>
        {secondary && (
          <div className="text-xs text-muted-foreground">{secondary}</div>
        )}
      </div>
    </Link>
  );
}

function fmtRefresh(d: Date): string {
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} 分鐘前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小時前`;
  return d.toLocaleString("zh-TW");
}

export default async function LeaderboardPage({ searchParams }: Props) {
  const tab = (searchParams.tab || "reputation") as Tab;
  const snap = await getSnapshot(tab);

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Trophy className="h-8 w-8 text-yellow-500" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">排行榜</h1>
          <p className="text-sm text-muted-foreground">
            每小時更新，看看誰最活躍、誰最受歡迎
          </p>
        </div>
        {snap && (
          <div className="text-right text-xs text-muted-foreground">
            <div className="flex items-center gap-1 justify-end">
              <RefreshCw className="h-3 w-3" />
              {fmtRefresh(snap.refreshedAt)} 更新
            </div>
          </div>
        )}
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b pb-0">
        {TABS.map((t) => {
          const isActive = t.key === tab;
          return (
            <Link
              key={t.key}
              href={`/leaderboard?tab=${t.key}`}
              className={cn(
                "flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className={cn("h-4 w-4", isActive && t.color)} />
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2">
        {!snap && (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            排行榜尚未計算（等下一次 cron 刷新）
          </div>
        )}
        {snap && snap.rows.length === 0 && (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            目前還沒有排名資料
          </div>
        )}
        {snap &&
          snap.rows.map((row, i) => {
            let primary = "";
            let secondary: string | undefined;
            switch (tab) {
              case "reputation":
                primary = `${formatNumber(Number(row.reputation || 0))} 名聲`;
                secondary = `總積分 ${formatNumber(Number(row.totalPoints || 0))}`;
                break;
              case "coins":
                primary = `${formatNumber(Number(row.coins || 0))} 金幣`;
                secondary = `+${formatNumber(Number(row.platinum || 0))} 白金幣`;
                break;
              case "posts":
                primary = `${formatNumber(Number(row.postCount || 0))} 篇`;
                secondary = `${formatNumber(Number(row.totalLikes || 0))} 讚 / ${formatNumber(Number(row.totalViews || 0))} 閱`;
                break;
              case "likes":
                primary = `${formatNumber(Number(row.totalLikes || 0))} 讚`;
                break;
              case "checkin":
                primary = `連續 ${row.streak} 天`;
                if (row.lastDate) {
                  secondary = new Date(row.lastDate as string).toLocaleDateString("zh-TW");
                }
                break;
              case "tips":
                primary = `${formatNumber(Number(row.totalTips || 0))} 金幣`;
                secondary = `${row.tipCount} 次打賞`;
                break;
            }
            return (
              <RankRow
                key={String(row.userId)}
                rank={i + 1}
                row={row}
                primary={primary}
                secondary={secondary}
              />
            );
          })}
      </div>
    </div>
  );
}
