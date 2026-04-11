import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { UserCard } from "@/components/user/user-card";
import { Pagination } from "@/components/shared/pagination";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

interface Props {
  params: { userId: string };
  searchParams: { page?: string; tab?: string };
}

export const metadata: Metadata = { title: "粉絲與追蹤" };

export default async function FollowersPage({ params, searchParams }: Props) {
  const user = await db.user.findUnique({
    where: { id: params.userId },
    select: { id: true, displayName: true },
  });

  if (!user) notFound();

  const tab = searchParams.tab || "followers";
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 20;

  let users: Array<{
    id: string;
    username: string;
    displayName: string;
    profile: { avatarUrl: string | null; signature: string | null } | null;
    points: { level: number } | null;
  }> = [];
  let total = 0;

  if (tab === "following") {
    const [follows, count] = await Promise.all([
      db.userFollow.findMany({
        where: { followerId: params.userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          following: {
            select: {
              id: true, username: true, displayName: true,
              profile: { select: { avatarUrl: true, signature: true } },
              points: { select: { level: true } },
            },
          },
        },
      }),
      db.userFollow.count({ where: { followerId: params.userId } }),
    ]);
    users = follows.map((f) => f.following);
    total = count;
  } else {
    const [follows, count] = await Promise.all([
      db.userFollow.findMany({
        where: { followingId: params.userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          follower: {
            select: {
              id: true, username: true, displayName: true,
              profile: { select: { avatarUrl: true, signature: true } },
              points: { select: { level: true } },
            },
          },
        },
      }),
      db.userFollow.count({ where: { followingId: params.userId } }),
    ]);
    users = follows.map((f) => f.follower);
    total = count;
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b">
        <a
          href={`/profile/${params.userId}/followers?tab=followers`}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "followers"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          粉絲
        </a>
        <a
          href={`/profile/${params.userId}/followers?tab=following`}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "following"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          追蹤中
        </a>
      </div>

      {users.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {users.map((u) => (
            <UserCard
              key={u.id}
              user={{
                id: u.id,
                username: u.username,
                displayName: u.displayName,
                avatarUrl: u.profile?.avatarUrl,
                level: u.points?.level,
                signature: u.profile?.signature,
              }}
            />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-muted-foreground">
          {tab === "following" ? "尚未追蹤任何人" : "尚無粉絲"}
        </p>
      )}
      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  );
}
