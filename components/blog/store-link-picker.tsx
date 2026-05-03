"use client";

import { useEffect, useState } from "react";
import { Search, X, Star } from "lucide-react";

type Ad = {
  id: string; title: string; city: string; district: string;
  coverImageUrl: string | null;
  ratingAvg: number; ratingCount: number;
};

export function StoreLinkPicker({
  adId, rating, onChange,
}: {
  adId: string | null;
  rating: number;
  onChange: (adId: string | null, rating: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [list, setList] = useState<Ad[]>([]);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<Ad | null>(null);

  useEffect(() => {
    if (!adId) { setPicked(null); return; }
    if (picked && picked.id === adId) return;
    fetch(`/api/business/ads/${adId}/preview`).then(r => r.json()).then(j => {
      if (j.success) setPicked(j.ad);
    }).catch(() => null);
  }, [adId]);

  async function search() {
    setBusy(true);
    try {
      const p = new URLSearchParams();
      if (q) p.set("q", q);
      if (city) p.set("city", city);
      const r = await fetch(`/api/business/ads/search?${p}`);
      const j = await r.json();
      if (j.success) setList(j.list);
    } finally { setBusy(false); }
  }

  function pick(ad: Ad) {
    setPicked(ad);
    onChange(ad.id, rating);
    setOpen(false);
  }
  function unset() {
    setPicked(null);
    onChange(null, 0);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        綁定店家 <span className="text-rose-400">*</span>
        <span className="ml-1 text-xs text-muted-foreground">(必須綁定有效的業者廣告)</span>
      </label>

      {picked ? (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-2">
          {picked.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={picked.coverImageUrl} alt="" className="h-14 w-14 rounded object-cover" />
          ) : <div className="h-14 w-14 rounded bg-muted" />}
          <div className="flex-1 text-sm">
            <p className="font-medium">{picked.title}</p>
            <p className="text-xs text-muted-foreground">{picked.city} {picked.district} · ★ {picked.ratingAvg.toFixed(1)} ({picked.ratingCount})</p>
          </div>
          <button type="button" onClick={unset} className="rounded p-1 text-muted-foreground hover:text-rose-400">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => { setOpen(true); search(); }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary">
          <Search className="h-4 w-4" /> 點此搜尋並綁定店家
        </button>
      )}

      {/* 評分 */}
      {picked && (
        <div>
          <label className="block text-xs font-medium">評分（選填，1~5 星）</label>
          <div className="mt-1 flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} type="button" onClick={() => onChange(picked.id, s === rating ? 0 : s)}>
                <Star className={`h-6 w-6 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 self-center text-xs text-muted-foreground">{rating} 星</span>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl border bg-card flex flex-col">
            <div className="flex items-center justify-between border-b p-3">
              <h3 className="font-bold">挑選綁定店家</h3>
              <button onClick={() => setOpen(false)}><X className="h-4 w-4" /></button>
            </div>
            <div className="border-b p-3 flex gap-2">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="店家名稱..."
                onKeyDown={(e) => { if (e.key === "Enter") search(); }}
                className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm" />
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="縣市"
                className="w-24 rounded-md border bg-background px-3 py-1.5 text-sm" />
              <button onClick={search} disabled={busy}
                className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground">
                {busy ? "..." : "搜尋"}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {list.length === 0 ? (
                <p className="col-span-full py-8 text-center text-sm text-muted-foreground">無資料</p>
              ) : list.map((ad) => (
                <button key={ad.id} type="button" onClick={() => pick(ad)}
                  className="text-left rounded-lg border bg-card hover:border-primary overflow-hidden">
                  {ad.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ad.coverImageUrl} alt="" loading="lazy"
                      className="aspect-[9/16] w-full object-cover" />
                  ) : (
                    <div className="aspect-[9/16] w-full bg-muted" />
                  )}
                  <div className="p-2 text-xs">
                    <p className="font-medium line-clamp-1">{ad.title}</p>
                    <p className="text-muted-foreground">{ad.city} {ad.district}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
