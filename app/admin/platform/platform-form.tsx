"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Check } from "lucide-react";

interface Props {
  initial: Record<string, unknown>;
  r18Info: { enabled: number; total: number };
}

export function PlatformSettingsForm({ initial, r18Info }: Props) {
  const router = useRouter();
  const [r18Enabled, setR18Enabled] = useState(
    initial.r18_enabled === true || initial.r18_enabled === "true"
  );
  const [verifyMode, setVerifyMode] = useState(
    (initial.age_gate_required_verify as string) || "declaration"
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/platform-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          r18_enabled: r18Enabled,
          age_gate_required_verify: verifyMode,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "儲存失敗");
      toast.success("已儲存");
      router.refresh();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* R-18 Toggle */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 shrink-0 text-amber-500" />
          <div>
            <h2 className="text-lg font-semibold">成人內容（R-18）模組</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              啟用後，使用者瀏覽標註 R-18 的分類/版區前需通過年齡閘道。
              目前平台共 {r18Info.total} 個 R-18 分類，{r18Info.enabled} 已啟用。
            </p>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={r18Enabled}
            onChange={(e) => setR18Enabled(e.target.checked)}
            className="h-5 w-5 rounded"
          />
          <span className="font-medium">啟用 R-18 內容模組</span>
        </label>

        {r18Enabled && (
          <div className="space-y-2 rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-medium">年齡驗證等級</p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="verify"
                value="declaration"
                checked={verifyMode === "declaration"}
                onChange={(e) => setVerifyMode(e.target.value)}
              />
              <span>自主宣告（輸入生日並勾選同意）— 低保護</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="verify"
                value="sms"
                checked={verifyMode === "sms"}
                onChange={(e) => setVerifyMode(e.target.value)}
                disabled
              />
              <span className="text-muted-foreground">
                手機簡訊驗證 — 中保護（未實作）
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="verify"
                value="kyc"
                checked={verifyMode === "kyc"}
                onChange={(e) => setVerifyMode(e.target.value)}
                disabled
              />
              <span className="text-muted-foreground">
                實名 KYC — 高保護（未實作）
              </span>
            </label>
          </div>
        )}

        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-400">
          ⚠️ 啟用 R-18 需確認您所在司法轄區允許此類內容，並自行承擔內容審核與合規責任。
          系統商僅提供技術工具，不對內容負責。
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <Button onClick={save} loading={saving} size="lg">
          <Check className="mr-2 h-4 w-4" />
          儲存設定
        </Button>
      </div>
    </div>
  );
}
