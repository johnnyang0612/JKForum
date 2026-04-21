import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { FriendButton } from "@/components/user/friend-button";
import { Users, Inbox, Send } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "我的好友" };

type Tab = "friends" | "incoming" | "outgoing";

interface Props {
  searchParams: { tab?: Tab };
}

export default async function FriendsPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const uid = session.user.id;
  const tab = (searchParams.tab || "friends") as Tab;

  const [accepted, incoming, outgoing] = await Promise.all([
    db.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: uid }, { addresseeId: uid }],
      },
      orderBy: { acceptedAt: "desc" },
    }),
    db.friendship.findMany({
      where: { status: "PENDING", addresseeId: uid },
      orderBy: { createdAt: "desc" },
    }),
    db.friendship.findMany({
      where: { status: "PENDING", requesterId: uid },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const ids = new Set<string>();
  accepted.forEach((f) => ids.add(f.requesterId === uid ? f.addresseeId : f.requesterId));
  incoming.forEach((f) => ids.add(f.requesterId));
  outgoing.forEach((f) => ids.add(f.addresseeId));

  const users = await db.user.findMany({
    where: { id: { in: Array.from(ids) } },
    select: {
      id: true,
      username: true,
      displayName: true,
      profile: { select: { avatarUrl: true, bio: true } },
    },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const tabs: Array<{ key: Tab; label: string; count: number; icon: typeof Users }> = [
    { key: "friends",  label: "我的好友", count: accepted.length, icon: Users },
    { key: "incoming", label: "收到邀請", count: incoming.length, icon: Inbox },
    { key: "outgoing", label: "送出邀請", count: outgoing.length, icon: Send },
  ];

  const renderUser = (
    targetId: string,
    relation: "accepted" | "incoming" | "outgoing"
  ) => {
    const u = userMap.get(targetId);
    if (!u) return null;
    return (
      <div
        key={targetId}
        className="flex items-center gap-3 rounded-lg border bg-card p-3"
      >
        <Link href={`/profile/${u.id}`} className="shrink-0">
          <Avatar
            src={u.profile?.avatarUrl || null}
            fallback={u.displayName}
            size="md"
          />
        </Link>
        <Link href={`/profile/${u.id}`} className="min-w-0 flex-1">
          <div className="truncate font-medium">{u.displayName}</div>
          <div className="truncate text-xs text-muted-foreground">
            {u.profile?.bio || `@${u.username}`}
          </div>
        </Link>
        <FriendButton userId={u.id} initial={relation} authenticated />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">我的好友</h1>
          <p className="text-sm text-muted-foreground">
            {accepted.length} 位好友
            {incoming.length > 0 && ` · ${incoming.length} 個待回應邀請`}
          </p>
        </div>
      </header>

      <nav className="flex gap-1 border-b">
        {tabs.map((t) => {
          const active = t.key === tab;
          return (
            <Link
              key={t.key}
              href={`/friends?tab=${t.key}`}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.count > 0 && (
                <span className="rounded-full bg-muted px-2 text-xs">
                  {t.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2">
        {tab === "friends" &&
          (accepted.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              還沒有好友 — 到個人頁面點「加好友」
            </div>
          ) : (
            accepted.map((f) =>
              renderUser(
                f.requesterId === uid ? f.addresseeId : f.requesterId,
                "accepted"
              )
            )
          ))}
        {tab === "incoming" &&
          (incoming.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              沒有待回應的邀請
            </div>
          ) : (
            incoming.map((f) => renderUser(f.requesterId, "incoming"))
          ))}
        {tab === "outgoing" &&
          (outgoing.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              沒有送出中的邀請
            </div>
          ) : (
            outgoing.map((f) => renderUser(f.addresseeId, "outgoing"))
          ))}
      </div>
    </div>
  );
}
