import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/utils/format";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "我管版的檢舉" };

const TYPE_LABELS: Record<string, string> = {
  PORNOGRAPHY: "色情",
  VIOLENCE: "暴力",
  SPAM: "垃圾訊息",
  HARASSMENT: "騷擾",
  MISINFORMATION: "假訊息",
  OTHER: "其他",
};

export default async function ModeratorReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  let myForumIds: string[];
  if (isAdmin) {
    const fs = await db.forum.findMany({ select: { id: true } });
    myForumIds = fs.map((f) => f.id);
  } else {
    const mods = await db.forumModerator.findMany({
      where: { userId: session.user.id }, select: { forumId: true },
    });
    myForumIds = mods.map((m) => m.forumId);
    if (myForumIds.length === 0) redirect("/moderator");
  }

  // 找這些版內的 post / reply target 為主
  // 拿管版內所有 postId、replyId
  const postIds = await db.post.findMany({
    where: { forumId: { in: myForumIds } },
    select: { id: true },
    take: 5000,
  });
  const postIdSet = new Set(postIds.map((p) => p.id));

  const candidateReports = await db.report.findMany({
    where: { status: { in: ["PENDING", "REVIEWING"] } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // 篩出 target 落在我管版內的（POST: targetId 在 postIdSet；REPLY: 要再查 reply 的 postId）
  const replyTargetIds = candidateReports.filter((r) => r.targetType === "REPLY").map((r) => r.targetId);
  const replyMap = new Map<string, string>(); // replyId → postId
  if (replyTargetIds.length > 0) {
    const replies = await db.reply.findMany({
      where: { id: { in: replyTargetIds } },
      select: { id: true, postId: true },
    });
    for (const r of replies) replyMap.set(r.id, r.postId);
  }

  const reports = candidateReports.filter((r) => {
    if (r.targetType === "POST") return postIdSet.has(r.targetId);
    if (r.targetType === "REPLY") {
      const postId = replyMap.get(r.targetId);
      return postId && postIdSet.has(postId);
    }
    return false; // USER 檢舉統一由 admin 處理
  });

  return (
    <div className="space-y-4">
      <div>
        <Link href="/moderator" className="text-xs text-muted-foreground hover:text-primary">← 版務後台</Link>
        <h1 className="mt-1 text-2xl font-bold">我管版的檢舉</h1>
        <p className="text-sm text-muted-foreground">
          {reports.length} 筆未處理。USER 類型檢舉由系統管理員集中處理。
        </p>
      </div>

      <div className="space-y-2">
        {reports.map((r) => (
          <div key={r.id} className="rounded-lg border bg-card p-3 text-sm">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {r.targetType} · {TYPE_LABELS[r.type] ?? r.type} · {timeAgo(r.createdAt)}
              </span>
              <Link
                href={r.targetType === "POST"
                  ? `/posts/${r.targetId}`
                  : `/posts/${replyMap.get(r.targetId) ?? ""}#reply-${r.targetId}`}
                className="text-primary hover:underline">
                查看目標
              </Link>
            </div>
            <p className="mt-1 text-sm">{r.reason}</p>
            {(session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN") && (
              <Link href={`/admin/reports/${r.id}`} className="mt-1 inline-block text-xs text-primary hover:underline">
                → 進入完整處理流程
              </Link>
            )}
          </div>
        ))}
        {reports.length === 0 && (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            目前無未處理檢舉
          </div>
        )}
      </div>
    </div>
  );
}
