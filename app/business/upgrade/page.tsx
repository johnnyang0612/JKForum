"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { toast } from "sonner";

export default function UpgradeToBusinessPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [merchantName, setMerchantName] = useState("");
  const [busy, setBusy] = useState(false);

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <p>請先登入</p>
        <Link href="/login"><Button className="mt-4">前往登入</Button></Link>
      </div>
    );
  }

  async function upgrade() {
    if (!merchantName.trim()) {
      toast.error("請填寫商號");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/business/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantName: merchantName.trim() }),
      });
      const j = await res.json();
      if (j.success) {
        toast.success("升級為業者帳號成功！");
        router.push("/business");
        router.refresh();
      } else toast.error(j.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg py-10">
      <div className="rounded-2xl border bg-card p-8">
        <Building2 className="mx-auto h-16 w-16 text-primary" />
        <h1 className="mt-4 text-center text-2xl font-bold">升級為業者帳號</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          升級後可在各版區刊登業者廣告、查看成效、管理錢包
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">商號 / 店名 *</label>
            <input
              type="text"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              placeholder="例：台北信義養生館"
              maxLength={60}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 text-xs">
            <h3 className="font-bold">業者權益</h3>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>✅ 在開放付費刊登的版區發布廣告</li>
              <li>✅ 5 級付費排序（免費 / 500 / 1000 / 2000 / 3000）</li>
              <li>✅ 業者後台：廣告管理 / 錢包 / 成效 / 提現</li>
              <li>✅ 認證後獲得「業者認證」徽章</li>
            </ul>
          </div>

          <Button className="w-full" onClick={upgrade} disabled={busy}>
            {busy ? "升級中..." : "確認升級為業者"}
          </Button>
        </div>
      </div>
    </div>
  );
}
