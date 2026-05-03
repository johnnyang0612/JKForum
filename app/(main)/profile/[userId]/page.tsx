import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserAvatar } from "@/components/user/user-avatar";
import { UserBadge } from "@/components/user/user-badge";
import { UserStats } from "@/components/user/user-stats";
import { UserLevelProgress } from "@/components/user/user-level-progress";
import { PointsPanel } from "@/components/profile/points-panel";
import { FollowButton } from "@/components/user/follow-button";
import { FriendButton } from "@/components/user/friend-button";
import { SendMessageButton } from "@/components/message/send-message-button";
import { PostCard } from "@/components/post/post-card";
import { Button } from "@/components/ui/button";
import { ROLE_DISPLAY_NAMES } from "@/lib/constants/roles";
import { formatDate } from "@/lib/utils/format";
import { Settings, Calendar, MapPin, Globe, FileText, MessageCircle, Star, BookOpen } from "lucide-react";
import { getGroupConfig } from "@/lib/user-groups";
import { ItemIcon } from "@/components/game/item-icon";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

type Tab = "activity" | "album" | "posts" | "replies";

interface Props {
  params: { userId: string };
  searchParams: { tab?: Tab };
}

async function getUser(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      points: true,
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await getUser(params.userId);
  if (!user) return { title: "用戶不存在" };
  return { title: `${user.displayName} 的個人檔案` };
}

export default async function UserProfilePage({ params, searchParams }: Props) {
  const user = await getUser(params.userId);
  const activeTab = (searchParams.tab || "activity") as Tab;

  if (!user || user.status === "DELETED") {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const isOwnProfile = session?.user?.id === user.id;
  const isAuthenticated = !!session;

  // Record visit (if logged-in visitor viewing someone else's profile)
  if (session?.user?.id && !isOwnProfile) {
    try {
      await db.profileVisit.upsert({
        where: {
          visitorId_profileId: {
            visitorId: session.user.id,
            profileId: user.id,
          },
        },
        create: { visitorId: session.user.id, profileId: user.id },
        update: { visitedAt: new Date() },
      });
    } catch {}
  }

  // Recent visitors (for profile owner only privacy)
  const recentVisitors = isOwnProfile
    ? await db.profileVisit.findMany({
        where: { profileId: user.id },
        orderBy: { visitedAt: "desc" },
        take: 10,
      })
    : [];
  const visitorUsers = recentVisitors.length
    ? await db.user.findMany({
        where: { id: { in: recentVisitors.map((v) => v.visitorId) } },
        select: {
          id: true,
          username: true,
          displayName: true,
          profile: { select: { avatarUrl: true } },
        },
      })
    : [];
  const visitorMap = new Map(visitorUsers.map((u) => [u.id, u]));

  // Check follow status
  let isFollowing = false;
  let friendRel: "none" | "outgoing" | "incoming" | "accepted" = "none";
  if (session?.user && !isOwnProfile) {
    const fr = await db.friendship.findFirst({
      where: {
        OR: [
          { requesterId: session.user.id, addresseeId: user.id },
          { requesterId: user.id, addresseeId: session.user.id },
        ],
      },
    });
    if (fr) {
      if (fr.status === "ACCEPTED") friendRel = "accepted";
      else if (fr.status === "PENDING") {
        friendRel = fr.requesterId === session.user.id ? "outgoing" : "incoming";
      }
    }
  }
  if (session?.user && !isOwnProfile) {
    const follow = await db.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: user.id,
        },
      },
    });
    isFollowing = !!follow;
  }

  // Tab-specific data
  const tabPosts =
    activeTab === "posts" || activeTab === "activity"
      ? await db.post.findMany({
          where: { authorId: user.id, status: "PUBLISHED" },
          orderBy: { createdAt: "desc" },
          take: activeTab === "posts" ? 30 : 10,
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profile: { select: { avatarUrl: true } },
                points: { select: { level: true } },
              },
            },
            forum: {
              select: { id: true, name: true, slug: true },
            },
            tags: { include: { tag: true } },
          },
        })
      : [];

  const tabReplies =
    activeTab === "replies" || activeTab === "activity"
      ? await db.reply.findMany({
          where: { authorId: user.id, status: "PUBLISHED" },
          orderBy: { createdAt: "desc" },
          take: activeTab === "replies" ? 30 : 10,
          include: {
            post: {
              select: {
                id: true,
                title: true,
                forum: { select: { name: true, slug: true } },
              },
            },
          },
        })
      : [];

  // Album = all <img> extracted from user's posts
  const albumImages: string[] = [];
  if (activeTab === "album") {
    const imgPosts = await db.post.findMany({
      where: { authorId: user.id, status: "PUBLISHED" },
      select: { id: true, content: true },
      orderBy: { createdAt: "desc" },
      take: 60,
    });
    const imgRe = /<img[^>]+src=["']([^"']+)["']/gi;
    for (const p of imgPosts) {
      if (!p.content) continue;
      let m: RegExpExecArray | null;
      while ((m = imgRe.exec(p.content)) !== null) {
        if (m[1]) albumImages.push(m[1]);
        if (albumImages.length >= 48) break;
      }
      if (albumImages.length >= 48) break;
      imgRe.lastIndex = 0;
    }
  }

  // Activity: merge posts + replies sorted by time
  type Activity =
    | { kind: "post"; at: Date; post: (typeof tabPosts)[number] }
    | { kind: "reply"; at: Date; reply: (typeof tabReplies)[number] };
  const activity: Activity[] =
    activeTab === "activity"
      ? [
          ...tabPosts.map((p) => ({ kind: "post" as const, at: p.createdAt, post: p })),
          ...tabReplies.map((r) => ({ kind: "reply" as const, at: r.createdAt, reply: r })),
        ]
          .sort((a, b) => b.at.getTime() - a.at.getTime())
          .slice(0, 20)
      : [];

  const recentPosts = tabPosts;

  const profile = user.profile;
  const points = user.points;
  const roleDisplay = ROLE_DISPLAY_NAMES[user.role] || "一般會員";

  const groupCfg = getGroupConfig(user.userGroup);
  const blogCount = await db.blog.count({ where: { authorId: user.id, isPublic: true } });

  // 用戶持有的勳章（勳章牆）
  const userMedals = await db.userMedal.findMany({
    where: { userId: user.id },
    include: { medal: true },
    orderBy: { awardedAt: "desc" },
    take: 30,
  });

  // 代表勳章（顯示在頭像旁）
  const repMedal = user.representativeMedalSlug
    ? await db.medal.findUnique({ where: { slug: user.representativeMedalSlug } })
    : null;

  // 道具陳列（前 8 個）
  const showcaseItems = await db.userGameItem.findMany({
    where: { userId: user.id, quantity: { gt: 0 } },
    include: { item: true },
    orderBy: [{ item: { rarity: "desc" } }, { quantity: "desc" }],
    take: 8,
  });

  // 認證狀態
  const isFullyVerified = !!user.emailVerified && !!user.smsVerified;

  // 好友簽到排名（最近 7 天簽到次數）
  const friendIds = await db.friendship.findMany({
    where: {
      OR: [
        { requesterId: user.id, status: "ACCEPTED" },
        { addresseeId: user.id, status: "ACCEPTED" },
      ],
    },
    select: { requesterId: true, addresseeId: true },
  });
  const friendIdSet = new Set<string>();
  for (const f of friendIds) {
    friendIdSet.add(f.requesterId === user.id ? f.addresseeId : f.requesterId);
  }
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
  const friendCheckinRank = friendIdSet.size
    ? await db.checkin.groupBy({
        by: ["userId"],
        where: { userId: { in: Array.from(friendIdSet) }, date: { gte: sevenDaysAgo } },
        _count: { _all: true },
        orderBy: { _count: { userId: "desc" } },
        take: 5,
      })
    : [];
  const rankUsers = friendCheckinRank.length
    ? await db.user.findMany({
        where: { id: { in: friendCheckinRank.map((r) => r.userId) } },
        select: { id: true, displayName: true, username: true, profile: { select: { avatarUrl: true } } },
      })
    : [];
  const rankUserMap = new Map(rankUsers.map((u) => [u.id, u]));

  // IP 遮罩（保留 a.b.*.* 給訪客看）
  const maskIp = (ip: string | null) => {
    if (!ip) return null;
    const parts = ip.split(".");
    if (parts.length !== 4) return ip.slice(0, 6) + "***";
    return `${parts[0]}.${parts[1]}.*.*`;
  };

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Cover photo / Banner */}
        {user.coverPhotoUrl ? (
          <div
            className="h-40 bg-cover bg-center sm:h-56"
            style={{ backgroundImage: `url(${user.coverPhotoUrl})` }}
          />
        ) : (
          <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 sm:h-40" />
        )}

        {/* User info */}
        <div className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4 -mt-12 sm:-mt-16">
              <div className="relative">
                <UserAvatar
                  src={profile?.avatarUrl}
                  fallback={user.displayName}
                  size="xl"
                  className={`ring-4 ring-card ${
                    user.avatarFrame === "gold" ? "ring-amber-400" :
                    user.avatarFrame === "silver" ? "ring-zinc-300" :
                    user.avatarFrame === "bronze" ? "ring-orange-700" :
                    user.avatarFrame === "purple" ? "ring-fuchsia-500" :
                    user.avatarFrame === "green" ? "ring-emerald-500" : ""
                  }`}
                />
                {/* 代表勳章 — 頭像右下角 */}
                {repMedal && (
                  <span
                    className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-card bg-card shadow-md overflow-hidden"
                    title={repMedal.name}
                  >
                    <ItemIcon iconUrl={repMedal.iconUrl} iconEmoji={repMedal.iconEmoji} alt={repMedal.name} size={32} />
                  </span>
                )}
                {/* 認證徽章 — 頭像右上角 */}
                {isFullyVerified && (
                  <span
                    className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-blue-500 text-white shadow-md"
                    title="已通過 Email + SMS 雙重驗證"
                  >
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </span>
                )}
              </div>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold">{user.displayName}</h1>
                  {points && <UserBadge level={points.level} />}
                  <span
                    className="rounded-full border bg-muted/40 px-2 py-0.5 text-xs"
                    title={`閱讀權限 ${user.readPermission}`}
                  >
                    {groupCfg.iconEmoji} {groupCfg.label}
                  </span>
                  {isFullyVerified && (
                    <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">
                      ✓ 已認證
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  @{user.username} · {roleDisplay}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 sm:mt-0">
              {isOwnProfile ? (
                <Link href="/settings/profile">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    編輯個人資料
                  </Button>
                </Link>
              ) : (
                <>
                  <FollowButton
                    userId={user.id}
                    isFollowing={isFollowing}
                    isAuthenticated={isAuthenticated}
                  />
                  <FriendButton
                    userId={user.id}
                    initial={friendRel}
                    authenticated={isAuthenticated}
                  />
                  <SendMessageButton
                    targetUserId={user.id}
                    isAuthenticated={isAuthenticated}
                  />
                </>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile?.bio && (
            <p className="mt-4 text-sm text-muted-foreground">{profile.bio}</p>
          )}

          {/* Meta info */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              加入於 {formatDate(user.createdAt)}
            </span>
            {user.lastLoginAt && (
              <span title={user.lastLoginAt.toLocaleString("zh-TW")}>
                上次訪問 {formatDate(user.lastLoginAt)}
              </span>
            )}
            {user.lastLoginIp && (
              <span className="font-mono text-xs">上次 IP {maskIp(user.lastLoginIp)}</span>
            )}
            {user.registerIp && (
              <span className="font-mono text-xs">註冊 IP {maskIp(user.registerIp)}</span>
            )}
            {blogCount > 0 && (
              <Link
                href={`/blog?author=${user.id}`}
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <BookOpen className="h-3.5 w-3.5" />
                {blogCount} 篇日誌
              </Link>
            )}
            {profile?.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {profile.location}
              </span>
            )}
            {profile?.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <Globe className="h-3.5 w-3.5" />
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>

          {/* Signature */}
          {profile?.signature && (
            <p className="mt-2 text-xs italic text-muted-foreground border-l-2 border-primary/30 pl-2">
              {profile.signature}
            </p>
          )}
        </div>
      </div>

      {/* Points and Level */}
      {points && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="font-semibold">等級進度</h3>
            <UserLevelProgress totalPoints={points.totalPoints} />
          </div>
          <PointsPanel points={points} />

          {/* 勳章牆 */}
          {userMedals.length > 0 && (
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">🏅 勳章牆 ({userMedals.length})</h3>
                {isOwnProfile && (
                  <Link href="/settings/profile" className="text-xs text-primary hover:underline">
                    設定代表勳章
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                {userMedals.slice(0, 16).map((um) => (
                  <div
                    key={`${um.userId}-${um.medalId}`}
                    title={`${um.medal.name} — ${um.medal.description ?? ""}`}
                    className={`group relative flex aspect-square items-center justify-center rounded-lg border bg-muted/30 transition hover:scale-110 hover:border-primary p-1 ${
                      um.medal.tier === "platinum" ? "border-fuchsia-500/40" :
                      um.medal.tier === "gold" ? "border-amber-500/40" :
                      um.medal.tier === "silver" ? "border-zinc-400/40" :
                      um.medal.tier === "bronze" ? "border-orange-700/40" : ""
                    } ${
                      user.representativeMedalSlug === um.medal.slug ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <ItemIcon iconUrl={um.medal.iconUrl} iconEmoji={um.medal.iconEmoji} alt={um.medal.name} size={36} />
                  </div>
                ))}
                {userMedals.length > 16 && (
                  <Link
                    href="/achieve/medal"
                    className="flex aspect-square items-center justify-center rounded-lg border bg-muted/30 text-xs text-muted-foreground hover:text-primary"
                  >
                    +{userMedals.length - 16}
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* 道具陳列 */}
          {showcaseItems.length > 0 && (
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">🎒 精選道具</h3>
                {isOwnProfile && (
                  <Link href="/achieve/game/inventory" className="text-xs text-primary hover:underline">
                    完整背包
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                {showcaseItems.map((ui) => {
                  const r = ui.item.rarity;
                  const colorMap: Record<string, string> = {
                    LEGENDARY: "border-amber-400 bg-amber-500/10",
                    EPIC:      "border-fuchsia-400 bg-fuchsia-500/10",
                    RARE:      "border-sky-400 bg-sky-500/10",
                    UNCOMMON:  "border-emerald-400 bg-emerald-500/10",
                    COMMON:    "",
                  };
                  return (
                    <div
                      key={ui.id}
                      title={`${ui.item.name} ×${ui.quantity}`}
                      className={`relative flex aspect-square flex-col items-center justify-center rounded-lg border-2 ${colorMap[r] ?? ""} text-center transition hover:scale-105`}
                    >
                      <ItemIcon iconUrl={ui.item.iconUrl} iconEmoji={ui.item.iconEmoji} alt={ui.item.name} size={32} />
                      <span className="absolute -bottom-1 -right-1 rounded-full bg-card px-1.5 text-[10px] font-bold border">
                        ×{ui.quantity}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 好友簽到排名（最近 7 天） */}
          {friendCheckinRank.length > 0 && (
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <h3 className="font-semibold">好友簽到排名（最近 7 天）</h3>
              <ol className="space-y-2 text-sm">
                {friendCheckinRank.map((r, idx) => {
                  const u = rankUserMap.get(r.userId);
                  if (!u) return null;
                  const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`;
                  return (
                    <li key={r.userId} className="flex items-center justify-between">
                      <Link href={`/profile/${u.id}`} className="flex items-center gap-2 hover:text-primary">
                        <span>{medal}</span>
                        <span>{u.displayName}</span>
                      </Link>
                      <span className="text-xs text-muted-foreground">{r._count._all} 次</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* Recent visitors — owner-only */}
          {isOwnProfile && recentVisitors.length > 0 && (
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <h3 className="font-semibold">最近訪客</h3>
              <div className="flex flex-wrap gap-3">
                {recentVisitors.map((v) => {
                  const u = visitorMap.get(v.visitorId);
                  if (!u) return null;
                  return (
                    <Link
                      key={v.visitorId}
                      href={`/profile/${u.id}`}
                      className="flex items-center gap-2 rounded-full bg-muted px-2 py-1 text-xs hover:bg-primary/10"
                      title={new Date(v.visitedAt).toLocaleString("zh-TW")}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {u.displayName.charAt(0)}
                      </span>
                      <span className="max-w-[100px] truncate">
                        {u.displayName}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <UserStats
        postCount={profile?.postCount || 0}
        replyCount={profile?.replyCount || 0}
        likeCount={profile?.likeCount || 0}
        followerCount={profile?.followerCount || 0}
      />

      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b overflow-x-auto">
        {(
          [
            { key: "activity", label: "動態", icon: Calendar },
            { key: "album",    label: "相簿", icon: Star },
            { key: "posts",    label: "文章", icon: FileText },
            { key: "replies",  label: "回覆", icon: MessageCircle },
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/profile/${user.id}?tab=${tab.key}`}
              className={`flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="space-y-3">
        {/* Activity */}
        {activeTab === "activity" && (
          <>
            {activity.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                還沒有任何動態
              </p>
            ) : (
              activity.map((a) =>
                a.kind === "post" ? (
                  <div
                    key={`p-${a.post.id}`}
                    className="rounded-lg border bg-card p-3"
                  >
                    <div className="text-xs text-muted-foreground mb-1.5">
                      <FileText className="inline h-3.5 w-3.5 mr-1" />
                      發表於 {a.post.forum?.name} · {formatDate(a.at)}
                    </div>
                    <Link
                      href={`/posts/${a.post.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {a.post.title}
                    </Link>
                    {a.post.excerpt && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {a.post.excerpt}
                      </p>
                    )}
                  </div>
                ) : (
                  <div
                    key={`r-${a.reply.id}`}
                    className="rounded-lg border bg-card p-3"
                  >
                    <div className="text-xs text-muted-foreground mb-1.5">
                      <MessageCircle className="inline h-3.5 w-3.5 mr-1" />
                      回覆於 {a.reply.post?.forum?.name} · {formatDate(a.at)}
                    </div>
                    <Link
                      href={`/posts/${a.reply.post?.id}`}
                      className="block text-sm font-medium hover:text-primary line-clamp-1"
                    >
                      {a.reply.post?.title}
                    </Link>
                    <p
                      className="mt-1 text-sm text-muted-foreground line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: a.reply.content.slice(0, 200) }}
                    />
                  </div>
                )
              )
            )}
          </>
        )}

        {/* Album */}
        {activeTab === "album" && (
          <>
            {albumImages.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                還沒有相片 — 在文章中加入圖片會自動收錄到相簿
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {albumImages.map((src, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={i}
                    src={src}
                    alt=""
                    loading="lazy"
                    className="aspect-square w-full rounded-md object-cover"
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Posts */}
        {activeTab === "posts" && (
          <>
            {recentPosts.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">暫無文章</p>
            ) : (
              recentPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={{
                    ...post,
                    author: {
                      id: post.author.id,
                      username: post.author.username,
                      displayName: post.author.displayName,
                      avatarUrl: post.author.profile?.avatarUrl,
                      level: post.author.points?.level,
                    },
                    tags: post.tags.map((t) => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })),
                  }}
                  showForum
                />
              ))
            )}
          </>
        )}

        {/* Replies */}
        {activeTab === "replies" && (
          <>
            {tabReplies.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">暫無回覆</p>
            ) : (
              tabReplies.map((r) => (
                <div key={r.id} className="rounded-lg border bg-card p-3">
                  <div className="text-xs text-muted-foreground mb-1.5">
                    回覆於 {r.post?.forum?.name} · {formatDate(r.createdAt)}
                  </div>
                  <Link
                    href={`/posts/${r.post?.id}`}
                    className="block text-sm font-medium hover:text-primary line-clamp-1"
                  >
                    {r.post?.title}
                  </Link>
                  <p
                    className="mt-1 text-sm text-muted-foreground line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: r.content.slice(0, 300) }}
                  />
                  <div className="mt-2 text-xs text-muted-foreground">
                    {r.likeCount} 讚
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
