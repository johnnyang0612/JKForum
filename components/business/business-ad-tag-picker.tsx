"use client";

/**
 * BusinessAdTagPicker — 配合項目（業者刊登）標籤多選器
 *
 * 規則：
 *  - 「不限」永遠在最前面；選中「不限」時自動清空其他選擇
 *  - 選任何其他標籤時，自動取消「不限」
 *  - 沒有上限
 *  - 用紫色 / primary 填色表示已選
 *  - 依 category 分組顯示
 */
import { useEffect, useMemo, useState } from "react";

export type BusinessTagOption = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  sortOrder: number;
  isUnlimited: boolean;
};

type Props = {
  // 受控：已選 tagId 陣列
  value: string[];
  onChange: (next: string[]) => void;
  // 可選：直接餵 options 進來避免重複 fetch
  initialOptions?: BusinessTagOption[];
  // 顯示／樣式
  className?: string;
  label?: string;
  helpText?: string;
};

export function BusinessAdTagPicker({
  value,
  onChange,
  initialOptions,
  className,
  label = "配合項目",
  helpText = "點擊標籤切換選擇；選「不限」即代表全部接受。",
}: Props) {
  const [options, setOptions] = useState<BusinessTagOption[]>(initialOptions ?? []);
  const [loading, setLoading] = useState(!initialOptions);

  useEffect(() => {
    if (initialOptions && initialOptions.length > 0) {
      setOptions(initialOptions);
      setLoading(false);
      return;
    }
    let cancel = false;
    (async () => {
      try {
        const r = await fetch("/api/business-tags", { cache: "no-store" });
        const j = await r.json();
        if (!cancel && j.success) setOptions(j.tags as BusinessTagOption[]);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [initialOptions]);

  const unlimited = useMemo(() => options.find((o) => o.isUnlimited), [options]);
  const selectedSet = useMemo(() => new Set(value), [value]);

  // 依 category 分組（不限獨立放最上）
  const grouped = useMemo(() => {
    const g: Record<string, BusinessTagOption[]> = {};
    for (const o of options) {
      if (o.isUnlimited) continue;
      const k = o.category ?? "其他";
      (g[k] ||= []).push(o);
    }
    // 依各組第一個 sortOrder 排
    return Object.entries(g).sort((a, b) => {
      const aMin = Math.min(...a[1].map((x) => x.sortOrder));
      const bMin = Math.min(...b[1].map((x) => x.sortOrder));
      return aMin - bMin;
    });
  }, [options]);

  function toggle(opt: BusinessTagOption) {
    if (opt.isUnlimited) {
      // 切「不限」開／關
      if (selectedSet.has(opt.id)) onChange([]);
      else onChange([opt.id]);
      return;
    }
    // 點其他 → 自動取消「不限」
    const next = new Set(selectedSet);
    if (unlimited) next.delete(unlimited.id);
    if (next.has(opt.id)) next.delete(opt.id);
    else next.add(opt.id);
    onChange(Array.from(next));
  }

  const pillCls = (selected: boolean) =>
    `select-none rounded-full border-2 px-3.5 py-1.5 text-sm font-medium transition active:scale-95 ${
      selected
        ? "border-primary bg-primary text-primary-foreground shadow-sm"
        : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted"
    }`;

  return (
    <div className={className}>
      {label && <label className="mb-1.5 block text-base font-bold">{label}</label>}
      {helpText && <p className="mb-2.5 text-sm text-foreground/70">{helpText}</p>}

      {loading ? (
        <div className="rounded-md border-2 bg-card p-4 text-sm text-foreground/60">
          標籤載入中...
        </div>
      ) : options.length === 0 ? (
        <div className="rounded-md border-2 bg-card p-4 text-sm text-foreground/60">
          尚未設定任何標籤，請聯絡管理員
        </div>
      ) : (
        <div className="space-y-3">
          {/* 不限 — 永遠第一 */}
          {unlimited && (
            <div>
              <button
                type="button"
                onClick={() => toggle(unlimited)}
                className={pillCls(selectedSet.has(unlimited.id))}
                aria-pressed={selectedSet.has(unlimited.id)}
              >
                {unlimited.name}
              </button>
            </div>
          )}

          {/* 各 category */}
          {grouped.map(([category, opts]) => (
            <div key={category}>
              <p className="mb-2 text-sm font-bold text-foreground/80">
                {category}
              </p>
              <div className="flex flex-wrap gap-2">
                {opts.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => toggle(o)}
                    className={pillCls(selectedSet.has(o.id))}
                    aria-pressed={selectedSet.has(o.id)}
                  >
                    {o.name}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <p className="pt-1 text-sm font-medium text-foreground/70">
            已選 <span className="font-bold text-primary">{value.length}</span> 項{value.length === 0 ? "（建議至少選擇 1 項或勾選「不限」）" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
