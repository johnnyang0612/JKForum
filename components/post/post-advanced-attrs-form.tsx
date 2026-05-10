"use client";

import { useMemo } from "react";
import { ListFilter } from "lucide-react";
import {
  FilterDef,
  safeParseFilterDefs,
} from "@/lib/advanced-filters";

/**
 * 發帖／編輯時，依當前看板 advancedFiltersJson 動態 render 屬性 inputs。
 * 寫入 Post.advancedAttrs，listing/forum 進階搜尋才能跟發帖內容連動。
 */
export function PostAdvancedAttrsForm({
  filterDefsRaw,
  values,
  onChange,
}: {
  filterDefsRaw: unknown;
  values: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}) {
  const defs = useMemo(() => safeParseFilterDefs(filterDefsRaw), [filterDefsRaw]);

  if (defs.length === 0) return null;

  function set(key: string, v: unknown) {
    const next = { ...values };
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) {
      delete next[key];
    } else {
      next[key] = v;
    }
    onChange(next);
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <ListFilter className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">本看板分類屬性</h3>
        <span className="text-xs text-muted-foreground">（非必填，但填了讀者更容易搜到你）</span>
      </div>

      {defs.map((def) => (
        <Field key={def.key} def={def} value={values[def.key]} onChange={(v) => set(def.key, v)} />
      ))}
    </div>
  );
}

function Field({
  def,
  value,
  onChange,
}: {
  def: FilterDef;
  value: unknown;
  onChange: (v: unknown) => void;
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
    const arr = Array.isArray(value) ? (value as string[]) : [];
    const set = new Set(arr);
    return (
      <div>
        <label className="mb-2 block text-sm font-semibold">
          {def.label}
          {arr.length > 0 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">已選 {arr.length}</span>
          )}
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
                  onChange(Array.from(next));
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

  // range — 對發文用單值（價位用「主打價」概念）
  const num = typeof value === "number" ? value : null;
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">
        {def.label} {def.unit ? <span className="text-xs font-normal text-muted-foreground">({def.unit})</span> : null}
      </label>
      <input
        type="number"
        inputMode="numeric"
        placeholder={`${def.min} ~ ${def.max}`}
        value={num ?? ""}
        step={def.step ?? 1}
        min={def.min}
        max={def.max}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? undefined : Number(v));
        }}
        className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
      />
    </div>
  );
}
