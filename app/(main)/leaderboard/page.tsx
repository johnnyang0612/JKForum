import Link from "next/link";
import { db } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { formatNumber } from "@/lib/utils/format";
import { getLevelByIndex } from "@/lib/constants/levels";
import { Trophy, Coins, Flame, MessageSquare, Gift, Calendar } from "lucide-react";
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

async function getReputationRanking() {
  return db.userPoints.findMany({
    orderBy: { reputation: "desc" },
    take: 50,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profile: { select: { avatarUrl: true } },
        },
      },
    },
  });
}

async function getCoinsRanking() {
  return db.userPoints.findMany({
    orderBy: { coins: "desc" },
    take: 50,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profile: { select: { avatarUrl: true } },
        },
      },
    },
  });
}

async function getPostsRanking() {
  const grouped = await db.post.groupBy({
    by: ["authorId"],
    where: { status: "PUBLISHED" },
    _count: { id: true },
    _sum: { likeCount: true, viewCount: true },
    orderBy: { _count: { id: "desc" } },
    take: 50,
  });
  const users = await db.user.findMany({
    where: { id: { in: grouped.map((g) => g.authorId) } },
    select: {
      id: true,
      username: true,
      displayName: true,
      profile: { select: { avatarUrl: true } },
      points: { select: { level: true } },
    },
  });
  const byId = new Map(users.map((u) => [u.id, u]));
  return grouped.map((g) => ({
    user: byId.get(g.authorId)!,
    postCount: g._count.id,
    totalLikes: g._sum.likeCount || 0,
    totalViews: g._sum.viewCount || 0,
  }));
}

async function getLikesRanking() {
  // Total likes received = sum(post.likeCount) per author
  const grouped = await db.post.groupBy({
    by: ["authorId"],
    where: { status: "PUBLISHED" },
    _sum: { likeCount: true },
    orderBy: { _sum: { likeCount: "desc" } },
    take: 50,
  });
  const users = await db.user.findMany({
    where: { id: { in: grouped.map((g) => g.authorId) } },
    select: {
      id: true,
      username: true,
      displayName: true,
      profile: { select: { avatarUrl: true } },
      points: { select: { level: true } },
    },
  });
  const byId = new Map(users.map((u) => [u.id, u]));
  return grouped
    .filter((g) => (g._sum.likeCount || 0) > 0)
    .map((g) => ({
      user: byId.get(g.authorId)!,
      totalLikes: g._sum.likeCount || 0,
    }));
}

async function getCheckinRanking() {
  // latest checkin per user, ordered by streak desc
  const checkins = await db.checkin.findMany({
    orderBy: { streak: "desc" },
    take: 50,
    distinct: ["userId"],
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profile: { select: { avatarUrl: true } },
          points: { select: { level: true } },
        },
      },
    },
  });
  return checkins.map((c) => ({
    user: c.user,
    streak: c.streak,
    lastDate: c.date,
  }));
}

async function getTipsRanking() {
  const grouped = await db.tip.groupBy({
    by: ["toId"],
    _sum: { amount: true },
    _count: { id: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 50,
  });
  const users = await db.user.findMany({
    where: { id: { in: grouped.map((g) => g.toId) } },
    select: {
      id: true,
      username: true,
      displayName: true,
      profile: { select: { avatarUrl: true } },
      points: { select: { level: true } },
    },
  });
  const byId = new Map(users.map((u) => [u.id, u]));
  return grouped.map((g) => ({
    user: byId.get(g.toId)!,
    totalTips: g._sum.amount || 0,
    tipCount: g._count.id,
  }));
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
  user,
  primary,
  secondary,
}: {
  rank: number;
  user: { id: string; displayName: string; username: string; profile?: { avatarUrl?: string | null } | null; points?: { level?: number } | null };
  primary: string;
  secondary?: string;
}) {
  const level = user.points?.level != null ? getLevelByIndex(user.points.level) : null;
  return (
    <Link
      href={`/profile/${user.id}`}
      className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary/30 hover:bg-muted/30"
    >
      <MedalNum rank={rank} />
      <Avatar
        src={user.profile?.avatarUrl || null}
        fallback={user.displayName}
        size="md"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{user.displayName}</span>
          {level && (
            <span
              className="rounded px-1 text-[10px] font-bold"
              style={{ color: level.color }}
            >
              {level.name}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">@{user.username}</div>
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

export default async function LeaderboardPage({ searchParams }: Props) {
  const tab = (searchParams.tab || "reputation") as Tab;

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Trophy className="h-8 w-8 text-yellow-500" />
        <div>
          <h1 className="text-2xl font-bold">排行榜</h1>
          <p className="text-sm text-muted-foreground">
            看看誰最活躍、誰最受歡迎、誰最會賺金幣
          </p>
        </div>
      </header>

      {/* Tabs */}
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

      {/* Content */}
      <div className="space-y-2">
        {tab === "reputation" &&
          (await getReputationRanking()).map((r, i) => (
            <RankRow
              key={r.user.id}
              rank={i + 1}
              user={r.user}
              primary={`${formatNumber(r.reputation)} 名聲`}
              secondary={`總積分 ${formatNumber(r.totalPoints)}`}
            />
          ))}
        {tab === "coins" &&
          (await getCoinsRanking()).map((r, i) => (
            <RankRow
              key={r.user.id}
              rank={i + 1}
              user={r.user}
              primary={`${formatNumber(r.coins)} 金幣`}
              secondary={`+${formatNumber(r.platinum)} 白金幣`}
            />
          ))}
        {tab === "posts" &&
          (await getPostsRanking()).map((r, i) => (
            <RankRow
              key={r.user.id}
              rank={i + 1}
              user={r.user}
              primary={`${formatNumber(r.postCount)} 篇`}
              secondary={`${formatNumber(r.totalLikes)} 讚 / ${formatNumber(r.totalViews)} 閱`}
            />
          ))}
        {tab === "likes" &&
          (await getLikesRanking()).map((r, i) => (
            <RankRow
              key={r.user.id}
              rank={i + 1}
              user={r.user}
              primary={`${formatNumber(r.totalLikes)} 讚`}
            />
          ))}
        {tab === "checkin" &&
          (await getCheckinRanking()).map((r, i) => (
            <RankRow
              key={r.user.id}
              rank={i + 1}
              user={r.user}
              primary={`連續 ${r.streak} 天`}
              secondary={new Date(r.lastDate).toLocaleDateString("zh-TW")}
            />
          ))}
        {tab === "tips" &&
          (await getTipsRanking()).map((r, i) => (
            <RankRow
              key={r.user.id}
              rank={i + 1}
              user={r.user}
              primary={`${formatNumber(r.totalTips)} 金幣`}
              secondary={`${r.tipCount} 次打賞`}
            />
          ))}
      </div>
    </div>
  );
}
