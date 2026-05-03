/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CoverUploader } from "@/components/business/cover-uploader";
import { MultiImageUploader } from "@/components/business/multi-image-uploader";

const TIERS = [
  { code: "FREE", price: 0, label: "免費" },
  { code: "T500", price: 500, label: "T500" },
  { code: "T1000", price: 1000, label: "T1000" },
  { code: "T2000", price: 2000, label: "T2000" },
  { code: "T3000", price: 3000, label: "🔥 T3000" },
];

export function AdEditExisting({
  adId, initial, balance, canEditTier,
}: {
  adId: string;
  initial: any;
  balance: number;
  canEditTier: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [city, setCity] = useState(initial.city);
  const [district, setDistrict] = useState(initial.district);
  const [tagsRaw, setTagsRaw] = useState(initial.tags.join(" "));
  const [coverImageUrl, setCoverImageUrl] = useState(initial.coverImageUrl);
  const [imageUrls, setImageUrls] = useState<string[]>(initial.imageUrls ?? []);
  const [priceMin, setPriceMin] = useState<number | "">(initial.priceMin ?? "");
  const [priceMax, setPriceMax] = useState<number | "">(initial.priceMax ?? "");
  const [tier, setTier] = useState(initial.tier);
  const [scheduledAt, setScheduledAt] = useState(initial.scheduledAt ?? "");
  const [busy, setBusy] = useState(false);

  const tierPrice = TIERS.find(t => t.code === tier)?.price ?? 0;

  async function save(submit = false) {
    setBusy(true);
    try {
      const r = await fetch(`/api/business/ads/${adId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(), description: description.trim(),
          city, district,
          tags: tagsRaw.split(/[,，\s]+/).map((s: string) => s.trim()).filter(Boolean).slice(0, 10),
          coverImageUrl: coverImageUrl || null,
          imageUrls,
          priceMin: priceMin === "" ? null : Number(priceMin),
          priceMax: priceMax === "" ? null : Number(priceMax),
          tier: canEditTier ? tier : undefined,
          scheduledAt: scheduledAt || null,
          submit, // true = 提交審核
        }),
      });
      const j = await r.json();
      if (j.success) {
        toast.success(submit ? "已送審" : "已儲存");
        router.push(`/business/ads/${adId}`);
        router.refresh();
      } else toast.error(j.error);
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-3 rounded-2xl border bg-card p-5">
      <div>
        <label className="mb-1 block text-sm font-medium">標題</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">簡介</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={500}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">封面</label>
        <CoverUploader value={coverImageUrl} onChange={setCoverImageUrl} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">店內照片 / 多圖（最多 8 張）</label>
        <MultiImageUploader value={imageUrls} onChange={setImageUrls} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">城市</label>
          <input value={city} onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">區域</label>
          <input value={district} onChange={(e) => setDistrict(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">標籤</label>
        <input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input type="number" placeholder="最低價" value={priceMin}
          onChange={(e) => setPriceMin(e.target.value === "" ? "" : Number(e.target.value))}
          className="rounded-md border bg-background px-3 py-2 text-sm" />
        <input type="number" placeholder="最高價" value={priceMax}
          onChange={(e) => setPriceMax(e.target.value === "" ? "" : Number(e.target.value))}
          className="rounded-md border bg-background px-3 py-2 text-sm" />
      </div>

      {canEditTier && (
        <div>
          <label className="mb-1 block text-sm font-medium">付費等級（送審時扣款 NT$ {tierPrice}）</label>
          <div className="grid grid-cols-5 gap-2">
            {TIERS.map(t => (
              <button key={t.code} type="button" onClick={() => setTier(t.code)}
                className={`rounded-lg border p-2 text-xs ${tier === t.code ? "border-primary bg-primary/10 text-primary" : ""}`}>
                {t.label}
              </button>
            ))}
          </div>
          {tierPrice > balance && (
            <p className="mt-1 text-xs text-rose-400">⚠️ 餘額不足 (差 NT$ {tierPrice - balance})</p>
          )}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">📅 排程發布（選填）</label>
        <input type="datetime-local" value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        <p className="mt-1 text-xs text-muted-foreground">若設定，審核通過後將於指定時間自動上架</p>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={() => save(false)} disabled={busy}>儲存草稿</Button>
        <Button onClick={() => save(true)} disabled={busy} className="flex-1">
          {busy ? "..." : `提交審核${tierPrice > 0 ? ` (扣 NT$ ${tierPrice})` : ""}`}
        </Button>
      </div>
    </div>
  );
}
