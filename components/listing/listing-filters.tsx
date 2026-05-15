"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, X, TrendingUp, Tag } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const STORE_KEY = "jkf_listing_filters_v1";

interface HotTag { slug: string; name: string; category: string | null; count: number }

export function ListingFilters({
  forums, regions, current, hotKeywords = [], hotTags = [],
}: {
  forums: { id: string; name: string }[];
  regions: Record<string, string[]>;
  current: { city: string; district: string; tier: string; forum: string; q: string; tagSlugs?: string[] };
  hotKeywords?: string[];
  hotTags?: HotTag[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const [city, setCity] = useState(current.city);
  const [district, setDistrict] = useState(current.district);
  const [tier, setTier] = useState(current.tier);
  const [forum, setForum] = useState(current.forum);
  const [q, setQ] = useState(current.q);
  const [tagSlugs, setTagSlugs] = useState<string[]>(current.tagSlugs ?? []);

  // 還原用戶上次篩選 (V1.1)
  useEffect(() => {
    if (current.city || current.district || current.q || current.forum || current.tier !== "ALL") return;
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.city) setCity(d.city);
      if (d.district) setDistrict(d.district);
      if (d.tier) setTier(d.tier);
      if (d.forum) setForum(d.forum);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 與 URL 同步
  useEffect(() => {
    setCity(current.city);
    setDistrict(current.district);
    setTier(current.tier);
    setForum(current.forum);
    setQ(current.q);
    setTagSlugs(current.tagSlugs ?? []);
  }, [current.city, current.district, current.tier, current.forum, current.q, current.tagSlugs?.join(",")]);

  const districts = regions[city] ?? [];

  function applyWith(nextTags?: string[]) {
    const finalTags = nextTags ?? tagSlugs;
    localStorage.setItem(STORE_KEY, JSON.stringify({ city, district, tier, forum }));
    if (q.trim()) {
      fetch(`/api/listing/search-log`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q.trim() }),
      }).catch(() => null);
    }
    const p = new URLSearchParams(sp.toString());
    setOrDel(p, "city", city);
    setOrDel(p, "district", district);
    setOrDel(p, "tier", tier !== "ALL" ? tier : "");
    setOrDel(p, "forum", forum);
    setOrDel(p, "q", q.trim());
    setOrDel(p, "tags", finalTags.join(","));
    p.delete("page");
    startTransition(() => router.push(`?${p.toString()}`));
  }
  const apply = () => applyWith();
  function reset() {
    localStorage.removeItem(STORE_KEY);
    setCity(""); setDistrict(""); setTier("ALL"); setForum(""); setQ(""); setTagSlugs([]);
    startTransition(() => router.push("?"));
  }
  function pickHot(kw: string) {
    setQ(kw);
    setTimeout(() => apply(), 50);
  }
  function toggleTag(slug: string) {
    const next = tagSlugs.includes(slug) ? tagSlugs.filter((s) => s !== slug) : [...tagSlugs, slug];
    setTagSlugs(next);
    setTimeout(() => applyWith(next), 30);
  }

  // hotTags 依 category 分組
  const tagsByCategory: Record<string, HotTag[]> = {};
  hotTags.forEach((t) => {
    const cat = t.category || "其他";
    (tagsByCategory[cat] ||= []).push(t);
  });

  return (
    <div className="rounded-xl border-2 bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 text-base font-bold sm:text-lg">
        <Search className="h-5 w-5 text-primary" />
        進階搜尋
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
        <select value={city} onChange={(e) => { setCity(e.target.value); setDistrict(""); }}
          className="rounded-md border-2 bg-background px-3 py-2.5 text-sm font-medium">
          <option value="">全部縣市</option>
          {Object.keys(regions).map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={district} onChange={(e) => setDistrict(e.target.value)} disabled={!city}
          className="rounded-md border-2 bg-background px-3 py-2.5 text-sm font-medium disabled:opacity-50">
          <option value="">全部區域</option>
          {districts.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select value={forum} onChange={(e) => setForum(e.target.value)}
          className="rounded-md border-2 bg-background px-3 py-2.5 text-sm font-medium">
          <option value="">全部版區</option>
          {forums.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <select value={tier} onChange={(e) => setTier(e.target.value)}
          className="rounded-md border-2 bg-background px-3 py-2.5 text-sm font-medium">
          <option value="ALL">全部等級</option>
          <option value="T3000">🔥 置頂</option>
          <option value="T2000">⭐ 精選</option>
          <option value="T1000">👑 推薦</option>
          <option value="T500">🌟 一般</option>
          <option value="FREE">免費</option>
        </select>
        <div className="flex gap-1">
          <input value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") apply(); }}
            placeholder="標題關鍵字..."
            className="flex-1 rounded-md border-2 bg-background px-3 py-2.5 text-sm font-medium" />
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="h-4 w-4" /> 清除
        </button>
        <button onClick={apply}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-base font-bold text-primary-foreground shadow-md hover:bg-primary/90 active:scale-[0.98]">
          <Search className="h-4 w-4" /> 套用篩選
        </button>
      </div>

      {hotKeywords.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <span className="flex items-center gap-1 text-sm font-medium text-foreground/70">
            <TrendingUp className="h-4 w-4" /> 熱門搜尋：
          </span>
          {hotKeywords.map((kw) => (
            <button key={kw} type="button" onClick={() => pickHot(kw)}
              className="rounded-full border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted">
              {kw}
            </button>
          ))}
        </div>
      )}

      {/* 配合項目 / 服務標籤 多選 */}
      {hotTags.length > 0 && (
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <Tag className="h-4 w-4 text-primary" /> 配合項目（可複選）
              {tagSlugs.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                  已選 {tagSlugs.length}
                </span>
              )}
            </span>
            {tagSlugs.length > 0 && (
              <button
                type="button"
                onClick={() => { setTagSlugs([]); applyWith([]); }}
                className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                清除標籤
              </button>
            )}
          </div>
          {Object.entries(tagsByCategory).map(([cat, tags]) => (
            <div key={cat} className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-foreground/60 sm:min-w-12">{cat}</span>
              {tags.map((t) => {
                const active = tagSlugs.includes(t.slug);
                return (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => toggleTag(t.slug)}
                    className={cn(
                      "rounded-full border-2 px-3 py-1 text-sm font-medium transition-all active:scale-95",
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-card hover:border-primary/50 hover:bg-muted"
                    )}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function setOrDel(p: URLSearchParams, k: string, v: string) {
  if (v) p.set(k, v); else p.delete(k);
}
