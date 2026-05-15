"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, X } from "lucide-react";
import { toast } from "sonner";

const REMEMBER_KEY = "jkf_age_gate_dismissed_v1";

export function AgeGateModal({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [dontAsk, setDontAsk] = useState(false);
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/age-gate/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "驗證失敗");
      if (dontAsk) {
        try {
          localStorage.setItem(REMEMBER_KEY, "1");
        } catch {/* ignore */}
      }
      router.push(returnTo);
      router.refresh();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const cancel = () => {
    router.push("/");
  };

  return (
    <div className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl border bg-card shadow-2xl">
      {/* 右上 X */}
      <button
        type="button"
        onClick={cancel}
        className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="關閉"
      >
        <X className="h-6 w-6" />
      </button>

      {/* 內容 */}
      <div className="px-6 py-8 sm:px-10 sm:py-10">
        {/* 紅鎖頭 */}
        <div className="mb-5 flex justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-lg">
            <Lock className="h-10 w-10" strokeWidth={2.5} />
            <span className="absolute -bottom-1 right-1 rounded-md bg-white px-1 text-[10px] font-extrabold text-rose-600">
              限
            </span>
          </div>
        </div>

        {/* 警告文 */}
        <p className="text-center text-sm leading-relaxed text-foreground sm:text-base">
          本網站依『電腦網際網路分級辦法』歸類為
          <strong className="text-rose-600">限制級</strong>，
          限定為年滿 <strong>18 歲</strong>已具有完整行為能力，
          且願意接受本站內影音內容及各項條款之網友才可瀏覽，
          <strong>未滿 18 歲謝絕進入</strong>。
        </p>
        <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
          為防範未滿 18 歲之未成年網友瀏覽網路上限制級內容的圖文資訊，
          建議您可進行
          <strong>網路分級基金會 TICRF 分級服務</strong>的安裝與設定。
          依電腦網路內容分級法，未滿 18 歲不得瀏覽。
        </p>

        {/* 不再提示 */}
        <label className="mt-5 flex items-center justify-end gap-2 text-sm">
          <input
            type="checkbox"
            checked={dontAsk}
            onChange={(e) => setDontAsk(e.target.checked)}
            className="h-4 w-4 rounded accent-rose-600"
          />
          <span className="font-medium text-foreground">不再提示</span>
        </label>
      </div>

      {/* 紅大按鈕 */}
      <button
        type="button"
        onClick={confirm}
        disabled={loading}
        className="block w-full bg-rose-600 px-6 py-4 text-base font-bold text-white transition hover:bg-rose-700 active:bg-rose-800 disabled:opacity-60"
      >
        {loading ? "處理中..." : "我已年滿 18"}
      </button>
    </div>
  );
}
