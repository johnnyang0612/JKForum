"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const STORE_KEY = "jkf_listing_filters_v1";

/** 主要城市（用全名與 region schema 一致，按使用熱度排序）*/
const PRIMARY_CITIES = ["台北市", "新北市", "桃園市", "台中市", "台南市", "高雄市"];
/** 按鈕顯示用短名映射 */
const SHORT_NAME: Record<string, string> = {
  "台北市": "台北", "新北市": "新北", "桃園市": "桃園",
  "台中市": "台中", "台南市": "台南", "高雄市": "高雄",
};

export function RegionQuickPicker({
  regions,
  currentCity,
  currentDistrict,
}: {
  regions: Record<string, string[]>;
  currentCity: string;
  currentDistrict: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    function onDown(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [moreOpen]);

  const allCities = Object.keys(regions);
  const moreCities = allCities.filter((c) => !PRIMARY_CITIES.includes(c));
  const districts = currentCity ? regions[currentCity] ?? [] : [];

  function pickCity(city: string) {
    const p = new URLSearchParams(sp.toString());
    if (city) p.set("city", city);
    else p.delete("city");
    p.delete("district");
    p.delete("page");
    persist({ city, district: "" });
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  }

  function pickDistrict(district: string) {
    const p = new URLSearchParams(sp.toString());
    if (district) p.set("district", district);
    else p.delete("district");
    p.delete("page");
    persist({ city: currentCity, district });
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  }

  function persist(d: { city: string; district: string }) {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      const old = raw ? JSON.parse(raw) : {};
      localStorage.setItem(STORE_KEY, JSON.stringify({ ...old, ...d }));
    } catch {}
  }

  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center gap-2 text-base font-bold sm:text-lg">
        <MapPin className="h-5 w-5 text-primary" />
        <span>快速選地區</span>
        {currentCity && (
          <span className="ml-auto rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary sm:text-sm">
            目前：{SHORT_NAME[currentCity] ?? currentCity}{currentDistrict ? ` / ${currentDistrict}` : ""}
          </span>
        )}
      </div>

      {/* 主要城市 */}
      <div className="flex flex-wrap gap-2">
        <CityBtn label="全部" active={!currentCity} onClick={() => pickCity("")} />
        {PRIMARY_CITIES.map((c) => (
          <CityBtn
            key={c}
            label={SHORT_NAME[c] ?? c}
            active={currentCity === c}
            onClick={() => pickCity(c)}
          />
        ))}
        {moreCities.length > 0 && (
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all",
                moreOpen
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card hover:border-primary/50 hover:bg-muted"
              )}
              aria-expanded={moreOpen}
              aria-haspopup="true"
            >
              更多
              <ChevronDown className={cn("h-4 w-4 transition-transform", moreOpen && "rotate-180")} />
            </button>
            {moreOpen && (
              <div className="absolute left-0 z-40 mt-2 flex w-[min(90vw,420px)] flex-wrap gap-2 rounded-xl border bg-card p-3 shadow-xl">
                {moreCities.map((c) => (
                  <CityBtn
                    key={c}
                    label={c}
                    active={currentCity === c}
                    onClick={() => {
                      pickCity(c);
                      setMoreOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 行政區（選了城市才出現） */}
      {currentCity && districts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
          <DistBtn label="全區" active={!currentDistrict} onClick={() => pickDistrict("")} />
          {districts.map((d) => (
            <DistBtn
              key={d}
              label={d}
              active={currentDistrict === d}
              onClick={() => pickDistrict(d)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CityBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all active:scale-95",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-md"
          : "border-border bg-card hover:border-primary/50 hover:bg-muted"
      )}
    >
      {label}
    </button>
  );
}

function DistBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all",
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border/50 bg-transparent text-muted-foreground hover:bg-muted"
      )}
    >
      {label}
    </button>
  );
}
