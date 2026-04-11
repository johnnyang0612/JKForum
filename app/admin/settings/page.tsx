"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function AdminSettingsPage() {
  const [siteName, setSiteName] = useState("JKForum");
  const [siteDescription, setSiteDescription] = useState("綜合型社群論壇平台");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    // Placeholder - would save to a settings table or config
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">系統設定</h1>
        <p className="mt-1 text-muted-foreground">管理網站基本設定</p>
      </div>

      {saved && (
        <div className="rounded-lg border border-success/50 bg-success/10 p-3 text-sm text-success">
          設定已儲存
        </div>
      )}

      <div className="max-w-lg space-y-4">
        <Input
          label="網站名稱"
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
        />
        <Textarea
          label="網站描述"
          value={siteDescription}
          onChange={(e) => setSiteDescription(e.target.value)}
        />

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">維護模式</p>
              <p className="text-xs text-muted-foreground">
                開啟後前台將顯示維護中畫面，僅管理員可存取
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                maintenanceMode ? "bg-danger" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  maintenanceMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        <Button onClick={handleSave}>儲存設定</Button>
      </div>
    </div>
  );
}
