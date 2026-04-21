"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AgeGateModal({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [birthdate, setBirthdate] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    if (!birthdate) return toast.error("請輸入生日");
    if (!agreed) return toast.error("請勾選同意條款");
    setLoading(true);
    try {
      const r = await fetch("/api/age-gate/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthdate }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "驗證失敗");
      toast.success("驗證通過");
      router.push(returnTo);
      router.refresh();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 shadow-2xl space-y-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-8 w-8 shrink-0 text-amber-500" />
        <div>
          <h2 className="text-xl font-bold">成人內容提醒</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            此區域包含限制級（R-18）內容，僅限年滿 18 歲之用戶瀏覽。
            請輸入您的生日以確認年齡。
          </p>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">您的生日</label>
        <input
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded"
        />
        <span className="text-muted-foreground">
          我已滿 18 歲，並確認自己所在地區法律允許瀏覽此類內容；我對瀏覽行為負全部責任。
        </span>
      </label>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => router.push("/")}
        >
          離開
        </Button>
        <Button
          className="flex-1"
          onClick={confirm}
          loading={loading}
          disabled={!birthdate || !agreed}
        >
          確認進入
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        通過驗證後 24 小時內不需再次確認。
      </p>
    </div>
  );
}
