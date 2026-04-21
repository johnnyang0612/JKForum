import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Precompute leaderboard snapshots. Triggered by Vercel Cron hourly.
 * Auth: `Authorization: Bearer ${CRON_SECRET}` (Vercel auto-injects).
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET) {
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const LIMIT = 100;
  const results: Record<string, number> = {};

  // 1. Reputation
  {
    const rows = await db.userPoints.findMany({
      orderBy: { reputation: "desc" },
      take: LIMIT,
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
    const serialized = rows.map((r) => ({
      userId: r.user.id,
      username: r.user.username,
      displayName: r.user.displayName,
      avatarUrl: r.user.profile?.avatarUrl ?? null,
      level: r.level,
      reputation: r.reputation,
      coins: r.coins,
      totalPoints: r.totalPoints,
    }));
    await db.leaderboardSnapshot.upsert({
      where: { type: "reputation" },
      create: { type: "reputation", rows: serialized, refreshedAt: now },
      update: { rows: serialized, refreshedAt: now },
    });
    results.reputation = rows.length;
  }

  // 2. Coins
  {
    const rows = await db.userPoints.findMany({
      orderBy: { coins: "desc" },
      take: LIMIT,
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
    const serialized = rows.map((r) => ({
      userId: r.user.id,
      username: r.user.username,
      displayName: r.user.displayName,
      avatarUrl: r.user.profile?.avatarUrl ?? null,
      level: r.level,
      coins: r.coins,
      platinum: r.platinum,
    }));
    await db.leaderboardSnapshot.upsert({
      where: { type: "coins" },
      create: { type: "coins", rows: serialized, refreshedAt: now },
      update: { rows: serialized, refreshedAt: now },
    });
    results.coins = rows.length;
  }

  // 3. Posts
  {
    const grouped = await db.post.groupBy({
      by: ["authorId"],
      where: { status: "PUBLISHED" },
      _count: { id: true },
      _sum: { likeCount: true, viewCount: true },
      orderBy: { _count: { id: "desc" } },
      take: LIMIT,
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
    const serialized = grouped.map((g) => {
      const u = byId.get(g.authorId);
      return {
        userId: g.authorId,
        username: u?.username,
        displayName: u?.displayName,
        avatarUrl: u?.profile?.avatarUrl ?? null,
        level: u?.points?.level,
        postCount: g._count.id,
        totalLikes: g._sum.likeCount || 0,
        totalViews: g._sum.viewCount || 0,
      };
    });
    await db.leaderboardSnapshot.upsert({
      where: { type: "posts" },
      create: { type: "posts", rows: serialized, refreshedAt: now },
      update: { rows: serialized, refreshedAt: now },
    });
    results.posts = grouped.length;
  }

  // 4. Likes
  {
    const grouped = await db.post.groupBy({
      by: ["authorId"],
      where: { status: "PUBLISHED" },
      _sum: { likeCount: true },
      orderBy: { _sum: { likeCount: "desc" } },
      take: LIMIT,
    });
    const filtered = grouped.filter((g) => (g._sum.likeCount || 0) > 0);
    const users = await db.user.findMany({
      where: { id: { in: filtered.map((g) => g.authorId) } },
      select: {
        id: true,
        username: true,
        displayName: true,
        profile: { select: { avatarUrl: true } },
        points: { select: { level: true } },
      },
    });
    const byId = new Map(users.map((u) => [u.id, u]));
    const serialized = filtered.map((g) => {
      const u = byId.get(g.authorId);
      return {
        userId: g.authorId,
        username: u?.username,
        displayName: u?.displayName,
        avatarUrl: u?.profile?.avatarUrl ?? null,
        level: u?.points?.level,
        totalLikes: g._sum.likeCount || 0,
      };
    });
    await db.leaderboardSnapshot.upsert({
      where: { type: "likes" },
      create: { type: "likes", rows: serialized, refreshedAt: now },
      update: { rows: serialized, refreshedAt: now },
    });
    results.likes = filtered.length;
  }

  // 5. Checkin streak
  {
    const checkins = await db.checkin.findMany({
      orderBy: { streak: "desc" },
      take: LIMIT,
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
    const serialized = checkins.map((c) => ({
      userId: c.user.id,
      username: c.user.username,
      displayName: c.user.displayName,
      avatarUrl: c.user.profile?.avatarUrl ?? null,
      level: c.user.points?.level,
      streak: c.streak,
      lastDate: c.date,
    }));
    await db.leaderboardSnapshot.upsert({
      where: { type: "checkin" },
      create: { type: "checkin", rows: serialized, refreshedAt: now },
      update: { rows: serialized, refreshedAt: now },
    });
    results.checkin = checkins.length;
  }

  // 6. Tips received
  {
    const grouped = await db.tip.groupBy({
      by: ["toId"],
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: "desc" } },
      take: LIMIT,
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
    const serialized = grouped.map((g) => {
      const u = byId.get(g.toId);
      return {
        userId: g.toId,
        username: u?.username,
        displayName: u?.displayName,
        avatarUrl: u?.profile?.avatarUrl ?? null,
        level: u?.points?.level,
        totalTips: g._sum.amount || 0,
        tipCount: g._count.id,
      };
    });
    await db.leaderboardSnapshot.upsert({
      where: { type: "tips" },
      create: { type: "tips", rows: serialized, refreshedAt: now },
      update: { rows: serialized, refreshedAt: now },
    });
    results.tips = grouped.length;
  }

  return NextResponse.json({
    ok: true,
    refreshedAt: now,
    results,
  });
}
