import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import { BlockedUsersList } from "@/components/settings/blocked-users-list";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "封鎖名單" };

export default async function BlockedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const blocks = await db.userBlock.findMany({
    where: { blockerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      blocked: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profile: { select: { avatarUrl: true } },
        },
      },
    },
  });

  const items = blocks.map((b) => ({
    blockedId: b.blockedId,
    username: b.blocked.username,
    displayName: b.blocked.displayName,
    avatarUrl: b.blocked.profile?.avatarUrl ?? null,
    createdAt: b.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">封鎖名單</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          被你封鎖的使用者：他們無法私訊你、無法在你的貼文/留言下回應，他們的內容也不會出現在你的 feed。
        </p>
      </div>

      <BlockedUsersList initial={items} />
    </div>
  );
}
