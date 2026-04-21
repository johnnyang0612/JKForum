import { db } from "@/lib/db";
import { PlatformSettingsForm } from "./platform-form";
import { Settings2 } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "平台設定" };

export default async function AdminPlatformPage() {
  const settings = await db.platformSetting.findMany();
  const map: Record<string, unknown> = {};
  for (const s of settings) map[s.key] = s.value;

  // R-18 enabled categories count
  const r18Cats = await db.category.count({
    where: { rating: "R18", isEnabled: true },
  });
  const totalR18Cats = await db.category.count({ where: { rating: "R18" } });

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Settings2 className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">平台設定</h1>
          <p className="text-sm text-muted-foreground">
            營運商配置 — 功能開關、合規設定、品牌
          </p>
        </div>
      </header>

      <PlatformSettingsForm
        initial={map}
        r18Info={{ enabled: r18Cats, total: totalR18Cats }}
      />
    </div>
  );
}
