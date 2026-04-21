import Link from "next/link";
import { db } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { Shield, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 600;

export const metadata: Metadata = { title: "管理團隊" };

export default async function TeamPage() {
  const admins = await db.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      profile: { select: { avatarUrl: true, bio: true } },
    },
  });

  const moderators = await db.forumModerator.findMany({
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profile: { select: { avatarUrl: true } },
        },
      },
      forum: { select: { name: true, slug: true } },
    },
  });

  const supers = admins.filter((a) => a.role === "SUPER_ADMIN");
  const regularAdmins = admins.filter((a) => a.role === "ADMIN");

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">管理團隊</h1>
          <p className="text-sm text-muted-foreground">
            維護社群秩序、確保優質討論環境的幕後英雄
          </p>
        </div>
      </header>

      {supers.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">站長</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {supers.map((u) => (
              <Link
                key={u.id}
                href={`/profile/${u.id}`}
                className="flex items-center gap-3 rounded-lg border bg-card p-4 transition hover:border-primary/30"
              >
                <Avatar
                  src={u.profile?.avatarUrl || null}
                  fallback={u.displayName}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{u.displayName}</div>
                  <div className="text-xs text-muted-foreground">
                    @{u.username}
                  </div>
                  <div className="mt-0.5 inline-flex items-center gap-1 rounded bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700 dark:text-yellow-400">
                    <Shield className="h-3 w-3" />
                    超級管理員
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {regularAdmins.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">管理員</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {regularAdmins.map((u) => (
              <Link
                key={u.id}
                href={`/profile/${u.id}`}
                className="flex items-center gap-3 rounded-lg border bg-card p-4 hover:border-primary/30"
              >
                <Avatar
                  src={u.profile?.avatarUrl || null}
                  fallback={u.displayName}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{u.displayName}</div>
                  <div className="text-xs text-muted-foreground">@{u.username}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">版主</h2>
        {moderators.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            目前各版尚無指派版主
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {moderators.map((m) => (
              <Link
                key={m.id}
                href={`/profile/${m.user.id}`}
                className="flex items-center gap-3 rounded-lg border bg-card p-3 hover:border-primary/30"
              >
                <Avatar
                  src={m.user.profile?.avatarUrl || null}
                  fallback={m.user.displayName}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    {m.user.displayName}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {m.forum.name}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
