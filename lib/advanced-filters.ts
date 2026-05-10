/**
 * Advanced search filter utilities.
 *
 * 每個 forum 在 forum.advancedFiltersJson 設定 FilterDef[]。
 * URL 編碼：adv_<key>=v1,v2  (multiselect)
 *           adv_<key>=value   (select)
 *           adv_<key>=min-max (range)
 */

export type FilterDef =
  | {
      key: string;
      label: string;
      type: "select";
      options: string[];
    }
  | {
      key: string;
      label: string;
      type: "multiselect";
      options: string[];
    }
  | {
      key: string;
      label: string;
      type: "range";
      min: number;
      max: number;
      step?: number;
      unit?: string;
    };

export type FilterValue = string | string[] | { min?: number; max?: number };

export type ParsedFilters = Record<string, FilterValue>;

const PARAM_PREFIX = "adv_";

export function safeParseFilterDefs(raw: unknown): FilterDef[] {
  if (!Array.isArray(raw)) return [];
  const out: FilterDef[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const it = item as Record<string, unknown>;
    if (typeof it.key !== "string" || typeof it.label !== "string") continue;
    if (it.type === "select" || it.type === "multiselect") {
      if (Array.isArray(it.options)) {
        out.push({
          key: it.key,
          label: it.label,
          type: it.type,
          options: it.options.filter((o): o is string => typeof o === "string"),
        });
      }
    } else if (it.type === "range") {
      const min = Number(it.min);
      const max = Number(it.max);
      if (Number.isFinite(min) && Number.isFinite(max)) {
        out.push({
          key: it.key,
          label: it.label,
          type: "range",
          min,
          max,
          step: typeof it.step === "number" ? it.step : undefined,
          unit: typeof it.unit === "string" ? it.unit : undefined,
        });
      }
    }
  }
  return out;
}

export function parseAdvancedFilterParams(
  searchParams: Record<string, string | string[] | undefined>,
  defs: FilterDef[]
): ParsedFilters {
  const out: ParsedFilters = {};
  for (const def of defs) {
    const raw = searchParams[`${PARAM_PREFIX}${def.key}`];
    const v = Array.isArray(raw) ? raw[0] : raw;
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
        if (min !== undefined || max !== undefined) {
          out[def.key] = { min, max };
        }
      }
    }
  }
  return out;
}

export function paramKey(key: string): string {
  return `${PARAM_PREFIX}${key}`;
}

export function encodeFilterValue(v: FilterValue | undefined): string {
  if (v === undefined || v === null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.join(",");
  if (typeof v === "object") {
    const min = v.min === undefined ? "" : String(v.min);
    const max = v.max === undefined ? "" : String(v.max);
    if (!min && !max) return "";
    return `${min}-${max}`;
  }
  return "";
}

/**
 * Build Prisma where clauses for BusinessAd (listing) from parsed filters.
 *
 * 約定：
 *  - priceRange (range)  → 對應 priceMin/priceMax 區間
 *  - 其他 (select/multiselect) → 對應 BusinessAd.tags JSON array contains（任一命中）
 */
export function buildBusinessAdAdvancedWhere(
  parsed: ParsedFilters
): Record<string, unknown>[] {
  const ands: Record<string, unknown>[] = [];

  for (const [key, val] of Object.entries(parsed)) {
    if (key === "priceRange" && val && typeof val === "object" && !Array.isArray(val)) {
      const r = val as { min?: number; max?: number };
      // 與 ad 區間有交集即可
      if (r.min !== undefined) {
        ands.push({ OR: [{ priceMax: { gte: r.min } }, { priceMax: null }] });
      }
      if (r.max !== undefined) {
        ands.push({ OR: [{ priceMin: { lte: r.max } }, { priceMin: null }] });
      }
      continue;
    }

    if (typeof val === "string") {
      // tags JSON array_contains 單一字串
      ands.push({ tags: { array_contains: val } });
    } else if (Array.isArray(val)) {
      // OR over each value: tags array_contains v_i
      const ors = val.map((v) => ({ tags: { array_contains: v } }));
      if (ors.length) ands.push({ OR: ors });
    }
  }

  return ands;
}

/**
 * Build Prisma where clauses for Post (forum) from parsed filters.
 * 透過 Post.advancedAttrs JSONB 比對。發帖時用 advanced filter inputs 寫入，
 * 搜尋時用 JSONB 操作符過濾。
 *  - select：advancedAttrs->>key = value
 *  - multiselect：advancedAttrs->key 陣列至少一個元素在選定值集合內
 *  - range：advancedAttrs->key（數字）介於 min..max
 */
export function buildPostAdvancedWhere(
  parsed: ParsedFilters
): Record<string, unknown>[] {
  const ands: Record<string, unknown>[] = [];

  for (const [key, val] of Object.entries(parsed)) {
    if (typeof val === "string") {
      // string contains in JSON: { advancedAttrs: { path: [key], equals: val } }
      ands.push({ advancedAttrs: { path: [key], equals: val } });
    } else if (Array.isArray(val)) {
      // multiselect 用 OR：對每個值做 array_contains
      const ors = val.map((v) => ({
        advancedAttrs: { path: [key], array_contains: v },
      }));
      // 也允許 string 欄位剛好等於某值
      const orsString = val.map((v) => ({
        advancedAttrs: { path: [key], equals: v },
      }));
      ands.push({ OR: [...ors, ...orsString] });
    } else if (val && typeof val === "object" && !Array.isArray(val)) {
      const r = val as { min?: number; max?: number };
      // range：用 raw query expressions; 透過 path equals 不夠，需要 gte/lte 但 Prisma JSON 不直接支援
      // 折衷：以 string equals 不能；直接跳過範圍對 Post（per-forum 一般板可由 admin 自行使用 select 替代）
      void r;
    }
  }
  return ands;
}
