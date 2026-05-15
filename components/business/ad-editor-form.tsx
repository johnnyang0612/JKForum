"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CoverUploader } from "@/components/business/cover-uploader";
import { MultiImageUploader } from "@/components/business/multi-image-uploader";
import { VideoUploader } from "@/components/business/video-uploader";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  BusinessAdTagPicker,
  type BusinessTagOption,
} from "@/components/business/business-ad-tag-picker";
import { Phone, MessageSquare, Lock } from "lucide-react";

type ForumOpt = {
  id: string;
  name: string;
  defaultTier: string;
  themes: string[];
  forceTheme: boolean;
  categoryName?: string;
  isR18?: boolean;
};

const TIERS: { code: string; label: string; price: number }[] = [
  { code: "FREE",  label: "免費（最後）", price: 0 },
  { code: "T500",  label: "Tier 1（500 點）", price: 500 },
  { code: "T1000", label: "Tier 2（1,000 點）", price: 1000 },
  { code: "T2000", label: "Tier 3（2,000 點）", price: 2000 },
  { code: "T3000", label: "Tier 4 置頂（3,000 點）", price: 3000 },
];

export function AdEditorForm({
  forums, regions, balance, merchantVerified,
}: {
  forums: ForumOpt[];
  regions: Record<string, string[]>;
  balance: number;
  merchantVerified?: boolean;
}) {
  const router = useRouter();
  const [forumId, setForumId] = useState(forums[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(""); // 簡介（純文字 ≤500，連動卡片 / SEO）
  const [contentHtml, setContentHtml] = useState(""); // 富文本長介紹
  const [city, setCity] = useState(Object.keys(regions)[0] ?? "");
  const [district, setDistrict] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [tagOptions, setTagOptions] = useState<BusinessTagOption[]>([]);
  const [theme, setTheme] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<number | "">("");
  const [priceMax, setPriceMax] = useState<number | "">("");
  const [tier, setTier] = useState("FREE");
  const [contactPhone, setContactPhone] = useState("");
  const [contactLine, setContactLine] = useState("");
  const [busy, setBusy] = useState(false);

  const forum = useMemo(() => forums.find((f) => f.id === forumId), [forumId, forums]);
  const districts = useMemo(() => regions[city] ?? [], [city, regions]);
  const tierPrice = useMemo(() => TIERS.find((t) => t.code === tier)?.price ?? 0, [tier]);
  const insufficient = tierPrice > balance;
  const isPaid = tier !== "FREE";

  // Tier 切回 FREE 時清空聯絡資訊
  useEffect(() => {
    if (!isPaid) {
      setContactPhone("");
      setContactLine("");
    }
  }, [isPaid]);

  useEffect(() => {
    fetch("/api/business-tags", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setTagOptions(j.tags as BusinessTagOption[]);
      })
      .catch(() => null);
  }, []);

  async function submit() {
    // 必填驗證（連動 filter 的欄位都是必勾/必填）
    if (!forumId) return toast.error("請選版區");
    if (!title.trim() || title.length < 4) return toast.error("標題至少 4 字");
    if (!description.trim() || description.length < 10) return toast.error("簡介至少 10 字");
    if (!city) return toast.error("請選縣市");
    if (!district) return toast.error("請選區域");
    if (forum?.forceTheme && !theme) return toast.error(`請選主題（${forum.themes.join("/")}）`);
    if (forum?.isR18 && !merchantVerified) {
      return toast.error("此版區為 R18，請先完成業者 KYC 認證");
    }
    if (insufficient) return toast.error("論壇點數不足，請先充點");

    setBusy(true);
    try {
      const res = await fetch("/api/business/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          forumId,
          title: title.trim(),
          description: description.trim(),
          contentHtml: contentHtml.trim() || null,
          city, district,
          tagIds,
          tags: tagOptions.filter((o) => tagIds.includes(o.id)).map((o) => o.name),
          theme: theme || null,
          coverImageUrl: coverImageUrl.trim() || null,
          imageUrls,
          videoUrls,
          priceMin: priceMin === "" ? null : Number(priceMin),
          priceMax: priceMax === "" ? null : Number(priceMax),
          tier,
          // 聯絡資訊：免費帖一律不接受（後端再驗）
          contactPhone: isPaid ? contactPhone.trim() || null : null,
          contactLine: isPaid ? contactLine.trim() || null : null,
        }),
      });
      const j = await res.json();
      if (j.success) {
        toast.success(tier === "FREE" ? "已送審！" : `已扣 ${tierPrice.toLocaleString()} 點並送審`);
        router.push(`/business/ads/${j.adId}`);
      } else toast.error(j.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5">
      {/* === 必勾欄位區（連動 Filter） === */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 sm:p-4 space-y-3">
        <div className="flex items-center gap-1 text-xs font-bold text-primary">
          <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">必填</span>
          以下欄位連動站內篩選器，會直接決定您的廣告被檢索的條件
        </div>

        {/* 版區（按分類分組） */}
        <div>
          <label className="mb-1 block text-xs font-medium">刊登版區 *</label>
          <select
            value={forumId}
            onChange={(e) => { setForumId(e.target.value); setTier(forums.find(f => f.id === e.target.value)?.defaultTier ?? "FREE"); }}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {(() => {
              const groups = new Map<string, ForumOpt[]>();
              for (const f of forums) {
                const k = f.categoryName ?? "其他";
                if (!groups.has(k)) groups.set(k, []);
                groups.get(k)!.push(f);
              }
              return Array.from(groups.entries()).map(([cat, items]) => (
                <optgroup key={cat} label={cat}>
                  {items.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.isR18 ? "🔞 " : ""}{f.name}
                    </option>
                  ))}
                </optgroup>
              ));
            })()}
          </select>
          {forum?.isR18 && (
            <p className={`mt-1 text-xs ${merchantVerified ? "text-amber-500" : "text-rose-500"}`}>
              🔞 R18 版區 ·{" "}
              {merchantVerified ? "您已通過認證" : "需先通過業者 KYC 認證"}
            </p>
          )}
        </div>

        {/* 主題 */}
        {forum && forum.themes.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-medium">
              主題 {forum.forceTheme && <span className="text-rose-500">*</span>}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {forum.themes.map((t) => (
                <button
                  key={t} type="button" onClick={() => setTheme(t === theme ? "" : t)}
                  className={`rounded-full border px-2.5 py-1 text-xs ${
                    t === theme ? "border-primary bg-primary/15 text-primary" : "hover:bg-muted"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 地區 */}
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium">縣市 *</label>
            <select value={city} onChange={(e) => { setCity(e.target.value); setDistrict(""); }}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              {Object.keys(regions).map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">區域 *</label>
            <select value={district} onChange={(e) => setDistrict(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">— 請選 —</option>
              {districts.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* 標籤（連動 filter） */}
        <BusinessAdTagPicker
          value={tagIds}
          onChange={setTagIds}
          initialOptions={tagOptions}
          label="配合項目（連動站內篩選）"
        />
      </div>

      {/* === 獨立欄位區 === */}
      <div>
        <label className="mb-1 block text-sm font-medium">標題 *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150}
          placeholder="例：信義區優質按摩館 全新裝潢"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        <p className="mt-1 text-xs text-muted-foreground">{title.length}/150</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">簡介 *（單行純文字，列表卡片用）</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={2}
          placeholder="服務內容、營業時間、特色…"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        <p className="mt-1 text-xs text-muted-foreground">{description.length}/500</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">詳細介紹（富文本 — 顏色／字型／字重／圖片／連結）</label>
        <RichTextEditor
          value={contentHtml}
          onChange={setContentHtml}
          placeholder="可加入詳細服務說明、價目表、營業時間、注意事項…可貼圖片、設文字顏色、加連結"
          uploadKind="ad-content"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">封面圖 *（9:16 直式建議 540x960）</label>
        <CoverUploader value={coverImageUrl} onChange={setCoverImageUrl} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">店內照片 / 多圖（選填，最多 8 張）</label>
        <MultiImageUploader value={imageUrls} onChange={setImageUrls} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">影片（選填，最多 3 段，每段 ≤30 秒）</label>
        <VideoUploader value={videoUrls} onChange={setVideoUrls} />
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
              <div className="mt-0.5 text-[10px] text-muted-foreground">{t.price === 0 ? "免費" : `${t.price} 點`}</div>
            </button>
          ))}
        </div>
        {insufficient && <p className="mt-2 text-xs text-rose-500">⚠️ 點數不足（差 {(tierPrice - balance).toLocaleString()} 點）</p>}
      </div>

      {/* === 聯絡資訊（僅付費可填） === */}
      <div className={`rounded-xl border p-3 sm:p-4 space-y-3 ${
        isPaid ? "border-emerald-500/40 bg-emerald-500/5" : "border-muted bg-muted/30 opacity-70"
      }`}>
        <div className="flex items-center gap-1.5 text-sm font-bold">
          {isPaid ? (
            <>
              <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] text-white">付費專屬</span>
              <span>聯絡資訊（會出現在廣告詳情頁）</span>
            </>
          ) : (
            <>
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>聯絡資訊 — 免費帖不可填</span>
            </>
          )}
        </div>
        {!isPaid && (
          <p className="text-xs text-muted-foreground">
            免費帖只能透過站內私訊接洽。升級到 T500 以上即可顯示電話與 LINE。
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-medium">
              <Phone className="h-3 w-3" /> 電話 / 手機
            </label>
            <input
              type="tel"
              disabled={!isPaid}
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              maxLength={40}
              placeholder={isPaid ? "例：0912-345-678" : "升級至付費才能填"}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-medium">
              <MessageSquare className="h-3 w-3" /> LINE ID
            </label>
            <input
              type="text"
              disabled={!isPaid}
              value={contactLine}
              onChange={(e) => setContactLine(e.target.value)}
              maxLength={60}
              placeholder={isPaid ? "例：@yourshop 或 https://line.me/..." : "升級至付費才能填"}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={submit} disabled={busy} className="flex-1">
          {busy ? "送出中..." : (tier === "FREE" ? "送審（免費）" : `扣點並送審（${tierPrice.toLocaleString()} 點）`)}
        </Button>
      </div>
    </div>
  );
}
