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
import { SendMessageButton } from "@/components/message/send-message-button";
import { PostCard } from "@/components/post/post-card";
import { Button } from "@/components/ui/button";
import { ROLE_DISPLAY_NAMES } from "@/lib/constants/roles";
import { formatDate } from "@/lib/utils/format";
import { Settings, Calendar, MapPin, Globe, FileText, MessageCircle, Star, Users } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

interface Props {
  params: { userId: string };
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
  return { title: `${user.displayName} 的���人檔案` };
}

export default async function UserProfilePage({ params }: Props) {
  const user = await getUser(params.userId);

  if (!user || user.status === "DELETED") {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const isOwnProfile = session?.user?.id === user.id;
  const isAuthenticated = !!session;

  // Check follow status
  let isFollowing = false;
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

  // Get recent posts
  const recentPosts = await db.post.findMany({
    where: { authorId: user.id, status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 5,
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
  });

  const profile = user.profile;
  const points = user.points;
  const roleDisplay = ROLE_DISPLAY_NAMES[user.role] || "一般會員";

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 sm:h-40" />

        {/* User info */}
        <div className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4 -mt-12 sm:-mt-16">
              <UserAvatar
                src={profile?.avatarUrl}
                fallback={user.displayName}
                size="xl"
                className="ring-4 ring-card"
              />
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{user.displayName}</h1>
                  {points && <UserBadge level={points.level} />}
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
      <div className="flex items-center gap-1 border-b">
        {[
          { href: `/profile/${user.id}`, label: "文章", icon: FileText, active: true },
          { href: `/profile/${user.id}/replies`, label: "回覆", icon: MessageCircle },
          { href: `/profile/${user.id}/favorites`, label: "收藏", icon: Star },
          { href: `/profile/${user.id}/followers`, label: "粉絲", icon: Users },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab.active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Recent Posts */}
      <div className="space-y-3">
        {recentPosts.length > 0 ? (
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
        ) : (
          <p className="py-12 text-center text-muted-foreground">暫無文章</p>
        )}
      </div>
    </div>
  );
}
