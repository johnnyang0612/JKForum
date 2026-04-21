/**
 * Medal Engine — auto-awards medals based on user metrics.
 *
 * Medal rule types:
 * - post_count           : total published posts authored
 * - reply_count          : total replies authored
 * - total_likes          : total likes received on posts + replies
 * - total_coins          : current coin balance
 * - checkin_streak       : latest streak value
 * - login_count          : total login ledger entries
 * - days_since_signup    : age of account in days
 * - featured_posts       : # of posts with isFeatured=true
 * - tips_received        : # of post_sold ledger entries as receiver
 * - vip_active           : has active VIP subscription
 * - role                 : matches ruleMetric (e.g. ADMIN / SUPER_ADMIN)
 */
import { db } from "./db";

export interface MedalAward {
  medalId: string;
  slug: string;
  name: string;
}

async function getUserStats(userId: string) {
  const [user, posts, replies, likesReceived, checkin, logins, featured, tips, vip] =
    await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          createdAt: true,
          points: { select: { coins: true } },
        },
      }),
      db.post.count({ where: { authorId: userId, status: "PUBLISHED" } }),
      db.reply.count({ where: { authorId: userId } }),
      Promise.all([
        db.post.aggregate({
          _sum: { likeCount: true },
          where: { authorId: userId, status: "PUBLISHED" },
        }),
        db.reply.aggregate({
          _sum: { likeCount: true },
          where: { authorId: userId },
        }),
      ]).then(([p, r]) => (p._sum.likeCount || 0) + (r._sum.likeCount || 0)),
      db.checkin.findFirst({
        where: { userId },
        orderBy: { date: "desc" },
        select: { streak: true },
      }),
      db.pointLedger.count({ where: { userId, action: "login" } }),
      db.post.count({
        where: { authorId: userId, isFeatured: true, status: "PUBLISHED" },
      }),
      db.pointLedger.count({ where: { userId, action: "post_sold" } }),
      db.vipSubscription.findFirst({
        where: { userId, status: "ACTIVE", endDate: { gt: new Date() } },
        select: { id: true },
      }),
    ]);

  const daysSinceSignup = user
    ? Math.floor((Date.now() - user.createdAt.getTime()) / 86400000)
    : 0;

  return {
    post_count: posts,
    reply_count: replies,
    total_likes: likesReceived,
    total_coins: user?.points?.coins ?? 0,
    checkin_streak: checkin?.streak ?? 0,
    login_count: logins,
    days_since_signup: daysSinceSignup,
    featured_posts: featured,
    tips_received: tips,
    vip_active: vip ? 1 : 0,
    role: user?.role ?? "USER",
  };
}

/**
 * Evaluate all active medals for a user and award any newly qualified ones.
 * Returns the list of newly awarded medals.
 */
export async function checkAndAwardMedals(
  userId: string
): Promise<MedalAward[]> {
  const [medals, owned] = await Promise.all([
    db.medal.findMany({ where: { isActive: true, isAuto: true } }),
    db.userMedal.findMany({
      where: { userId },
      select: { medalId: true },
    }),
  ]);
  const ownedIds = new Set(owned.map((o) => o.medalId));
  const todo = medals.filter((m) => !ownedIds.has(m.id));
  if (todo.length === 0) return [];

  const stats = await getUserStats(userId);
  const awards: MedalAward[] = [];

  for (const m of todo) {
    let qualifies = false;
    switch (m.ruleType) {
      case "role":
        qualifies =
          m.ruleMetric === stats.role ||
          (m.ruleMetric === "ADMIN" &&
            (stats.role === "ADMIN" || stats.role === "SUPER_ADMIN"));
        break;
      case "vip_active":
        qualifies = stats.vip_active >= 1;
        break;
      default: {
        const k = m.ruleType as keyof typeof stats;
        const value = stats[k];
        if (typeof value === "number" && m.ruleValue != null) {
          qualifies = value >= m.ruleValue;
        }
      }
    }
    if (qualifies) {
      try {
        await db.userMedal.create({
          data: { userId, medalId: m.id },
        });
        awards.push({ medalId: m.id, slug: m.slug, name: m.name });
      } catch {
        // unique-constraint race: someone else just awarded this medal
      }
    }
  }
  return awards;
}

/** Safe wrapper. */
export async function checkAndAwardMedalsSafe(userId: string) {
  try {
    return await checkAndAwardMedals(userId);
  } catch (e) {
    console.error("[medal-engine] check failed", userId, e);
    return [];
  }
}
