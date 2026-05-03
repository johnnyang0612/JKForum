"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CoverUploader } from "@/components/business/cover-uploader";
import { MultiImageUploader } from "@/components/business/multi-image-uploader";

type ForumOpt = {
  id: string;
  name: string;
  defaultTier: string;
  themes: string[];
  forceTheme: boolean;
};

const TIERS: { code: string; label: string; price: number }[] = [
  { code: "FREE",  label: "免費刊登（最後）", price: 0 },
  { code: "T500",  label: "Tier 1（NT$500）", price: 500 },
  { code: "T1000", label: "Tier 2（NT$1,000）", price: 1000 },
  { code: "T2000", label: "Tier 3（NT$2,000）", price: 2000 },
  { code: "T3000", label: "Tier 4 置頂（NT$3,000）", price: 3000 },
];

export function AdEditorForm({
  forums, regions, balance,
}: {
  forums: ForumOpt[];
  regions: Record<string, string[]>;
  balance: number;
}) {
  const router = useRouter();
  const [forumId, setForumId] = useState(forums[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState(Object.keys(regions)[0] ?? "");
  const [district, setDistrict] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [theme, setTheme] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<number | "">("");
  const [priceMax, setPriceMax] = useState<number | "">("");
  const [tier, setTier] = useState("FREE");
  const [busy, setBusy] = useState(false);

  const forum = useMemo(() => forums.find((f) => f.id === forumId), [forumId, forums]);
  const districts = useMemo(() => regions[city] ?? [], [city, regions]);
  const tierPrice = useMemo(() => TIERS.find((t) => t.code === tier)?.price ?? 0, [tier]);
  const insufficient = tierPrice > balance;

  async function submit() {
    if (!forumId) return toast.error("請選版區");
    if (!title.trim() || title.length < 4) return toast.error("標題至少 4 字");
    if (!description.trim() || description.length < 10) return toast.error("簡介至少 10 字");
    if (!city || !district) return toast.error("請選地區");
    if (forum?.forceTheme && !theme) return toast.error(`請選主題（${forum.themes.join("/")}）`);
    if (insufficient) return toast.error("錢包餘額不足，請先儲值");

    setBusy(true);
    try {
      const res = await fetch("/api/business/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          forumId, title: title.trim(), description: description.trim(),
          city, district,
          tags: tagsRaw.split(/[,，\s]+/).map(s => s.trim()).filter(Boolean).slice(0, 10),
          theme: theme || null,
          coverImageUrl: coverImageUrl.trim() || null,
          imageUrls,
          priceMin: priceMin === "" ? null : Number(priceMin),
          priceMax: priceMax === "" ? null : Number(priceMax),
          tier,
        }),
      });
      const j = await res.json();
      if (j.success) {
        toast.success(tier === "FREE" ? "已送審！" : `已扣款並送審 NT$ ${tierPrice.toLocaleString()}`);
        router.push(`/business/ads/${j.adId}`);
      } else toast.error(j.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5">
      {/* 版區 */}
      <div>
        <label className="mb-1 block text-sm font-medium">刊登版區 *</label>
        <select
          value={forumId} onChange={(e) => { setForumId(e.target.value); setTier(forums.find(f => f.id === e.target.value)?.defaultTier ?? "FREE"); }}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          {forums.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      {/* 主題（如版區強制） */}
      {forum && forum.themes.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium">
            主題 {forum.forceTheme && <span className="text-rose-400">*</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {forum.themes.map((t) => (
              <button
                key={t} type="button" onClick={() => setTheme(t === theme ? "" : t)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  t === theme ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 標題 / 簡介 */}
      <div>
        <label className="mb-1 block text-sm font-medium">標題 *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150}
          placeholder="例：信義區優質按摩館 全新裝潢"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        <p className="mt-1 text-xs text-muted-foreground">{title.length}/150</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">簡介 *</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={4}
          placeholder="服務內容、營業時間、特色..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        <p className="mt-1 text-xs text-muted-foreground">{description.length}/500</p>
      </div>

      {/* 地區 */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">縣市 *</label>
          <select value={city} onChange={(e) => { setCity(e.target.value); setDistrict(""); }}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm">
            {Object.keys(regions).map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">區域 *</label>
          <select value={district} onChange={(e) => setDistrict(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm">
            <option value="">— 請選 —</option>
            {districts.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* 標籤 / 封面 */}
      <div>
        <label className="mb-1 block text-sm font-medium">標籤（用空格或逗號分隔，最多 10 個）</label>
        <input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="例：冷氣 停車 24小時 信用卡"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">封面圖 *（9:16 直式建議 540x960）</label>
        <CoverUploader value={coverImageUrl} onChange={setCoverImageUrl} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">店內照片 / 多圖（選填，最多 8 張）</label>
        <MultiImageUploader value={imageUrls} onChange={setImageUrls} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">價格區間 - 最低（選填）</label>
          <input type="number" min={0} value={priceMin} onChange={(e) => setPriceMin(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">價格區間 - 最高（選填）</label>
          <input type="number" min={0} value={priceMax} onChange={(e) => setPriceMax(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        </div>
      </div>

      {/* 付費等級 */}
      <div>
        <label className="mb-2 block text-sm font-medium">刊登等級 * <span className="text-xs text-muted-foreground">（一次扣款，30 天到期）</span></label>
        <div className="grid gap-2 sm:grid-cols-5">
          {TIERS.map((t) => (
            <button
              key={t.code} type="button" onClick={() => setTier(t.code)}
              className={`rounded-lg border px-2 py-2 text-center text-xs transition ${
                tier === t.code ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
              }`}
            >
              <div className="font-bold">{t.code}</div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">{t.price === 0 ? "免費" : `NT$${t.price}`}</div>
            </button>
          ))}
        </div>
        {insufficient && <p className="mt-2 text-xs text-rose-400">⚠️ 餘額不足（差 NT$ {(tierPrice - balance).toLocaleString()}）</p>}
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={submit} disabled={busy} className="flex-1">
          {busy ? "送出中..." : (tier === "FREE" ? "送審（免費）" : `扣款並送審（NT$ ${tierPrice.toLocaleString()}）`)}
        </Button>
      </div>
    </div>
  );
}
