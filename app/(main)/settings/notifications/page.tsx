import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { PushButton } from "@/components/push/push-button";
import { NotificationPrefsForm } from "@/components/settings/notification-prefs-form";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "通知設定" };

export default async function NotificationSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await db.userProfile.findUnique({
    where: { userId: session.user.id },
    select: { notificationPrefs: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">通知設定</h2>
        <p className="text-sm text-muted-foreground">控制要接收哪些通知 + 透過哪個渠道</p>
      </div>

      {/* PWA Push */}
      <section className="space-y-3 rounded-xl border bg-card p-4">
        <div>
          <h3 className="font-bold">📱 推播通知</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            啟用後即使關閉瀏覽器也能收到重要通知（需要 Chrome / Edge / Firefox / Safari iOS 16.4+）
          </p>
        </div>
        <PushButton />
      </section>

      <NotificationPrefsForm
        initial={(profile?.notificationPrefs ?? {}) as Record<string, Record<string, boolean>>}
      />

      <p className="text-xs text-muted-foreground">
        Email / LINE 渠道：開啟後系統會在重要事件時透過該渠道通知你（待管理員接通對應服務後正式生效）。
      </p>
    </div>
  );
}
