"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from "lucide-react";
import {
  FilterDef,
  ParsedFilters,
  encodeFilterValue,
  paramKey,
  safeParseFilterDefs,
} from "@/lib/advanced-filters";

/**
 * 通用的進階搜尋面板。可放在 listing 頁或 forum (post) 頁。
 * 從父層收 filterDefs (FilterDef[])，把選定值寫進 URL adv_<key>。
 */
export function AdvancedFilterPanel({
  filterDefsRaw,
  initialOpen = false,
  scope = "listing",
}: {
  // 從 server 直接傳 forum.advancedFiltersJson (unknown)，這裡再 safeParse 一次
  filterDefsRaw: unknown;
  initialOpen?: boolean;
  scope?: "listing" | "forum";
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(initialOpen);

  const defs = useMemo(() => safeParseFilterDefs(filterDefsRaw), [filterDefsRaw]);

  // 從 URL 還原當前值
  const [values, setValues] = useState<ParsedFilters>(() => {
    return defsFromUrl(defs, sp);
  });

  // forum 切換時重設
  useEffect(() => {
    setValues(defsFromUrl(defs, sp));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defs]);

  if (defs.length === 0) {
    return null;
  }

  const activeCount = countActive(values);

  function setValue(key: string, v: ParsedFilters[string] | undefined) {
    setValues((prev) => {
      const next = { ...prev };
      if (v === undefined) delete next[key];
      else next[key] = v;
      return next;
    });
  }

  function apply() {
    const params = new URLSearchParams(sp.toString());
    // 清掉所有 adv_*
    for (const k of Array.from(params.keys())) {
      if (k.startsWith("adv_")) params.delete(k);
    }
    for (const [key, val] of Object.entries(values)) {
      const enc = encodeFilterValue(val);
      if (enc) params.set(paramKey(key), enc);
    }
    params.delete("page");
    startTransition(() => router.push(`?${params.toString()}`));
  }

  function reset() {
    setValues({});
    const params = new URLSearchParams(sp.toString());
    for (const k of Array.from(params.keys())) {
      if (k.startsWith("adv_")) params.delete(k);
    }
    params.delete("page");
    startTransition(() => router.push(`?${params.toString()}`));
  }

  return (
    <div className="rounded-xl border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-sm font-semibold hover:bg-muted/50"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <span>進階搜尋</span>
          {activeCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
              {activeCount} 條件
            </span>
          )}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="space-y-5 border-t p-4">
          {defs.map((def) => (
            <FilterRow
              key={def.key}
              def={def}
              value={values[def.key]}
              onChange={(v) => setValue(def.key, v)}
            />
          ))}

          <div className="sticky bottom-0 -mx-4 -mb-4 flex items-center justify-between gap-2 border-t bg-card/95 p-3 backdrop-blur">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" /> 清除進階
            </button>
            <button
              type="button"
              onClick={apply}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98]"
            >
              套用進階搜尋
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterRow({
  def,
  value,
  onChange,
}: {
  def: FilterDef;
  value: ParsedFilters[string] | undefined;
  onChange: (v: ParsedFilters[string] | undefined) => void;
}) {
  if (def.type === "select") {
    return (
      <div>
        <label className="mb-2 block text-sm font-semibold">{def.label}</label>
        <select
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
        >
          <option value="">—</option>
          {def.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (def.type === "multiselect") {
    const arr = Array.isArray(value) ? value : [];
    const set = new Set(arr);
    return (
      <div>
        <label className="mb-2 block text-sm font-semibold">
          {def.label}
          {arr.length > 0 && <span className="ml-2 text-xs font-normal text-muted-foreground">已選 {arr.length}</span>}
        </label>
        <div className="flex flex-wrap gap-2">
          {def.options.map((opt) => {
            const active = set.has(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  const next = new Set(arr);
                  if (active) next.delete(opt);
                  else next.add(opt);
                  const list = Array.from(next);
                  onChange(list.length ? list : undefined);
                }}
                className={
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95 " +
                  (active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-foreground hover:bg-muted")
                }
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // range
  const range = (typeof value === "object" && !Array.isArray(value) && value) || {};
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">
        {def.label} {def.unit ? <span className="text-xs font-normal text-muted-foreground">({def.unit})</span> : null}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          placeholder={String(def.min)}
          value={range.min ?? ""}
          step={def.step ?? 1}
          min={def.min}
          max={def.max}
          onChange={(e) => {
            const n = e.target.value === "" ? undefined : Number(e.target.value);
            const next = { ...range, min: n };
            if (next.min === undefined && next.max === undefined) onChange(undefined);
            else onChange(next as ParsedFilters[string]);
          }}
          className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm sm:py-2 sm:text-sm"
        />
        <span className="text-sm text-muted-foreground">到</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder={String(def.max)}
          value={range.max ?? ""}
          step={def.step ?? 1}
          min={def.min}
          max={def.max}
          onChange={(e) => {
            const n = e.target.value === "" ? undefined : Number(e.target.value);
            const next = { ...range, max: n };
            if (next.min === undefined && next.max === undefined) onChange(undefined);
            else onChange(next as ParsedFilters[string]);
          }}
          className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm sm:py-2 sm:text-sm"
        />
      </div>
    </div>
  );
}

function defsFromUrl(defs: FilterDef[], sp: URLSearchParams): ParsedFilters {
  const out: ParsedFilters = {};
  for (const def of defs) {
    const v = sp.get(`adv_${def.key}`);
    if (!v) continue;
    if (def.type === "select") {
      if (def.options.includes(v)) out[def.key] = v;
    } else if (def.type === "multiselect") {
      const picks = v.split(",").map((s) => s.trim()).filter(Boolean);
      const valid = picks.filter((p) => def.options.includes(p));
      if (valid.length) out[def.key] = valid;
    } else if (def.type === "range") {
      const m = v.match(/^(-?\d+(?:\.\d+)?)?-(-?\d+(?:\.\d+)?)?$/);
      if (m) {
        const min = m[1] ? Number(m[1]) : undefined;
        const max = m[2] ? Number(m[2]) : undefined;
        if (min !== undefined || max !== undefined) out[def.key] = { min, max };
      }
    }
  }
  return out;
}

function countActive(values: ParsedFilters): number {
  let n = 0;
  for (const v of Object.values(values)) {
    if (typeof v === "string" && v) n++;
    else if (Array.isArray(v) && v.length) n++;
    else if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      const r = v as { min?: number; max?: number };
      if (r.min !== undefined || r.max !== undefined) n++;
    }
  }
  return n;
}
