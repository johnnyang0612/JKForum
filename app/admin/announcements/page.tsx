import { db } from "@/lib/db";
import type { Metadata } from "next";
import { AnnouncementsManager } from "@/components/admin/announcements-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "公告管理" };

export default async function AdminAnnouncementsPage() {
  const list = await db.announcement.findMany({
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">公告管理</h1>
        <p className="text-sm text-muted-foreground mt-1">
          全站公告會在首頁、Header 通知中心顯示。可設定起訖時間自動上下架。
        </p>
      </div>
      <AnnouncementsManager initial={list.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        severity: a.severity,
        isPinned: a.isPinned,
        startAt: a.startAt?.toISOString() ?? null,
        endAt: a.endAt?.toISOString() ?? null,
        createdAt: a.createdAt.toISOString(),
      }))} />
    </div>
  );
}
