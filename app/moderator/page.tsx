import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Shield, FileText, MessageSquare, Flag } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "版務後台" };

export default async function ModeratorDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  // 我管的版（admin 視為管全版）
  const forums = isAdmin
    ? await db.forum.findMany({
        orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
        include: { category: { select: { name: true } } },
        take: 50,
      })
    : (
        await db.forumModerator.findMany({
          where: { userId: session.user.id },
          include: {
            forum: { include: { category: { select: { name: true } } } },
          },
        })
      ).map((m) => m.forum);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">版務後台</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        {isAdmin
          ? "你是管理員，可管所有看板"
          : `你管 ${forums.length} 個看板`}
      </p>

      {forums.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          尚無管理的版區，請聯絡管理員指派
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {forums.map((f) => (
            <div key={f.id} className="rounded-lg border bg-card p-4 space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">{f.category?.name}</p>
                <p className="font-bold">{f.name}</p>
                <p className="text-xs text-muted-foreground">
                  {f.postCount.toLocaleString()} 篇 · 今日 +{f.todayPostCount}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <Link href={`/moderator/forums/${f.id}`}
                  className="rounded border px-3 py-1.5 hover:bg-muted min-h-[40px] inline-flex items-center">
                  版務設定
                </Link>
                <Link href={`/forums/${f.category?.name ?? ""}/${f.slug}`}
                  className="rounded border px-3 py-1.5 hover:bg-muted min-h-[40px] inline-flex items-center"
                  prefetch={false}>
                  前台檢視
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/moderator/reports"
          className="flex items-center gap-2 rounded-lg border bg-card p-4 hover:bg-muted">
          <Flag className="h-5 w-5 text-warning" />
          <div>
            <p className="font-medium text-sm">檢舉處理</p>
            <p className="text-xs text-muted-foreground">處理我管版區內的檢舉</p>
          </div>
        </Link>
        <Link href="/moderator/posts"
          className="flex items-center gap-2 rounded-lg border bg-card p-4 hover:bg-muted">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium text-sm">最新文章</p>
            <p className="text-xs text-muted-foreground">查看版內最新發文</p>
          </div>
        </Link>
        <Link href="/moderator/replies"
          className="flex items-center gap-2 rounded-lg border bg-card p-4 hover:bg-muted">
          <MessageSquare className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium text-sm">最新留言</p>
            <p className="text-xs text-muted-foreground">查看版內最新留言</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
