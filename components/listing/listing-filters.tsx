"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, X, TrendingUp, SlidersHorizontal } from "lucide-react";

const STORE_KEY = "jkf_listing_filters_v1";

export function ListingFilters({
  forums, regions, current, hotKeywords = [],
}: {
  forums: { id: string; name: string }[];
  regions: Record<string, string[]>;
  current: { city: string; district: string; tier: string; forum: string; q: string };
  hotKeywords?: string[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const [city, setCity] = useState(current.city);
  const [district, setDistrict] = useState(current.district);
  const [tier, setTier] = useState(current.tier);
  const [forum, setForum] = useState(current.forum);
  const [q, setQ] = useState(current.q);

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

  // 與 URL 同步：當 RegionQuickPicker 或外部 nav 改 URL，重設下方 select
  useEffect(() => {
    setCity(current.city);
    setDistrict(current.district);
    setTier(current.tier);
    setForum(current.forum);
    setQ(current.q);
  }, [current.city, current.district, current.tier, current.forum, current.q]);

  const districts = regions[city] ?? [];

  function apply() {
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
    p.delete("page");
    startTransition(() => router.push(`?${p.toString()}`));
  }
  function reset() {
    localStorage.removeItem(STORE_KEY);
    setCity(""); setDistrict(""); setTier("ALL"); setForum(""); setQ("");
    startTransition(() => router.push("?"));
  }
  function pickHot(kw: string) {
    setQ(kw);
    setTimeout(() => apply(), 50);
  }

  return (
    <div className="rounded-xl border bg-card p-3 space-y-2">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <select value={city} onChange={(e) => { setCity(e.target.value); setDistrict(""); }}
          className="rounded-md border bg-background px-2 py-1.5 text-xs">
          <option value="">全部縣市</option>
          {Object.keys(regions).map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={district} onChange={(e) => setDistrict(e.target.value)} disabled={!city}
          className="rounded-md border bg-background px-2 py-1.5 text-xs disabled:opacity-50">
          <option value="">全部區域</option>
          {districts.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select value={forum} onChange={(e) => setForum(e.target.value)}
          className="rounded-md border bg-background px-2 py-1.5 text-xs">
          <option value="">全部版區</option>
          {forums.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <select value={tier} onChange={(e) => setTier(e.target.value)}
          className="rounded-md border bg-background px-2 py-1.5 text-xs">
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
            className="flex-1 rounded-md border bg-background px-2 py-1.5 text-xs" />
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={reset} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <X className="h-3 w-3" /> 清除
        </button>
        <button onClick={apply}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90">
          <Search className="h-3 w-3" /> 套用篩選
        </button>
      </div>

      {hotKeywords.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t pt-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" /> 熱門搜尋：
          </span>
          {hotKeywords.map((kw) => (
            <button key={kw} type="button" onClick={() => pickHot(kw)}
              className="rounded-full bg-muted px-2 py-0.5 text-xs hover:bg-muted/80">
              {kw}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function setOrDel(p: URLSearchParams, k: string, v: string) {
  if (v) p.set(k, v); else p.delete(k);
}
