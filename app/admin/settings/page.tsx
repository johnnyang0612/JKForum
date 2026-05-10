import { db } from "@/lib/db";
import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "系統設定" };

const KEYS = [
  "site.name",
  "site.description",
  "site.logoUrl",
  "site.faviconUrl",
  "site.seoTitle",
  "site.seoDescription",
  "site.contactEmail",
  "site.maintenanceMode",
  "site.maintenanceMessage",
];

export default async function AdminSettingsPage() {
  const rows = await db.platformSetting.findMany({ where: { key: { in: KEYS } } });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">系統設定</h1>
        <p className="mt-1 text-sm text-muted-foreground">站名、SEO、聯絡資訊與維護模式。</p>
      </div>
      <SettingsForm initial={map} />
    </div>
  );
}
