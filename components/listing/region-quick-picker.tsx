"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const STORE_KEY = "jkf_listing_filters_v1";

/** 主要城市（按使用熱度排序，其他歸到「更多」）*/
const PRIMARY_CITIES = ["台北", "新北", "桃園", "台中", "台南", "高雄"];

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
    <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-card p-3 sm:p-4">
      <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
        <MapPin className="h-4 w-4 text-primary" />
        快速選地區
        {currentCity && (
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            目前：<span className="text-primary">{currentCity}{currentDistrict ? ` / ${currentDistrict}` : ""}</span>
          </span>
        )}
      </div>

      {/* 主要城市 */}
      <div className="flex flex-wrap gap-1.5">
        <CityBtn label="全部" active={!currentCity} onClick={() => pickCity("")} />
        {PRIMARY_CITIES.map((c) => (
          <CityBtn
            key={c}
            label={c}
            active={currentCity === c}
            onClick={() => pickCity(c)}
          />
        ))}
        {moreCities.length > 0 && (
          <details className="relative">
            <summary className="inline-flex cursor-pointer list-none items-center rounded-full border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted">
              更多 ▾
            </summary>
            <div className="absolute z-30 mt-1 flex max-w-[280px] flex-wrap gap-1.5 rounded-xl border bg-card p-2 shadow-lg">
              {moreCities.map((c) => (
                <CityBtn
                  key={c}
                  label={c}
                  active={currentCity === c}
                  onClick={() => pickCity(c)}
                />
              ))}
            </div>
          </details>
        )}
      </div>

      {/* 行政區（選了城市才出現） */}
      {currentCity && districts.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5 border-t pt-2.5">
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
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
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
        "rounded-md border px-2 py-1 text-[11px] transition-all",
        active
          ? "border-primary/50 bg-primary/15 text-primary"
          : "border-border/50 bg-transparent text-muted-foreground hover:bg-muted"
      )}
    >
      {label}
    </button>
  );
}
