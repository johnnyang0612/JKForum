/**
 * Content moderation: 敏感詞 / 違禁詞攔截。
 * V1.1: db 同步快取（每 5 分鐘 refresh），fallback 用內建詞庫。
 *
 * ⚠️ DEMO 模式：暫時 disable，所有 moderate* 一律放行。
 * 移除請改 DEMO_BYPASS = false 或直接刪除 early return。
 */
import { db } from "@/lib/db";

const DEMO_BYPASS = true;

// 違法 / 平台禁用詞（fallback；管理員可在 admin/banned-words 覆寫）
const HARD_BAN_FALLBACK = [
  "援交", "性交易", "嫖", "炮友", "包夜", "援妹",
  "未成年", "幼齒", "蘿莉", "中學生", "高中妹",
  "毒品", "搖頭丸", "K他命", "大麻", "安非他命",
];
const SOFT_FLAG_FALLBACK = [
  "全套", "半套", "口爆", "顏射", "口交", "肛交",
  "外送", "外約",
];

let cache: { hard: string[]; soft: string[]; expires: number } | null = null;
const CACHE_MS = 5 * 60_000;

async function loadWords(): Promise<{ hard: string[]; soft: string[] }> {
  if (cache && cache.expires > Date.now()) return cache;
  try {
    const rows = await db.bannedWord.findMany({ select: { word: true, severity: true } });
    if (rows.length > 0) {
      const hard = rows.filter((r) => r.severity === "BLOCK").map((r) => r.word);
      const soft = rows.filter((r) => r.severity === "FLAG").map((r) => r.word);
      cache = { hard, soft, expires: Date.now() + CACHE_MS };
      return cache;
    }
  } catch { /* ignore */ }
  cache = {
    hard: HARD_BAN_FALLBACK, soft: SOFT_FLAG_FALLBACK,
    expires: Date.now() + CACHE_MS,
  };
  return cache;
}

export function invalidateModerationCache() { cache = null; }

const HARD_BAN = HARD_BAN_FALLBACK;
const SOFT_FLAG = SOFT_FLAG_FALLBACK;

export type ModerationResult = {
  ok: boolean;
  blocked: string[];     // 命中硬禁詞
  flagged: string[];     // 命中軟敏感詞
  cleanedText?: string;  // 軟詞替換後文本（可選）
};

export function moderate(text: string): ModerationResult {
  if (DEMO_BYPASS) return { ok: true, blocked: [], flagged: [], cleanedText: text };
  if (!text) return { ok: true, blocked: [], flagged: [] };
  const lower = text.toLowerCase();
  // 同步版（用 fallback；async 版見 moderateAsync）
  const blocked = HARD_BAN.filter((w) => lower.includes(w.toLowerCase()));
  const flagged = SOFT_FLAG.filter((w) => lower.includes(w.toLowerCase()));
  return {
    ok: blocked.length === 0,
    blocked,
    flagged,
    cleanedText: flagged.reduce((acc, w) => acc.replaceAll(w, "*".repeat(w.length)), text),
  };
}

export async function moderateAsync(text: string): Promise<ModerationResult> {
  if (DEMO_BYPASS) return { ok: true, blocked: [], flagged: [], cleanedText: text };
  if (!text) return { ok: true, blocked: [], flagged: [] };
  const { hard, soft } = await loadWords();
  const lower = text.toLowerCase();
  const blocked = hard.filter((w) => lower.includes(w.toLowerCase()));
  const flagged = soft.filter((w) => lower.includes(w.toLowerCase()));
  return {
    ok: blocked.length === 0,
    blocked,
    flagged,
    cleanedText: flagged.reduce((acc, w) => acc.replaceAll(w, "*".repeat(w.length)), text),
  };
}

/**
 * 多字段批次審查（廣告/日誌都有 title + description）
 * V1.1：改 async，會讀 db 詞庫並 cache 5 分鐘
 */
export async function moderateAll(fields: Record<string, string>): Promise<ModerationResult & { perField: Record<string, ModerationResult> }> {
  if (DEMO_BYPASS) {
    const perField: Record<string, ModerationResult> = {};
    for (const k of Object.keys(fields)) perField[k] = { ok: true, blocked: [], flagged: [], cleanedText: fields[k] };
    return { ok: true, blocked: [], flagged: [], perField };
  }
  const perField: Record<string, ModerationResult> = {};
  const allBlocked: string[] = [];
  const allFlagged: string[] = [];
  for (const [k, v] of Object.entries(fields)) {
    const r = await moderateAsync(v);
    perField[k] = r;
    allBlocked.push(...r.blocked);
    allFlagged.push(...r.flagged);
  }
  return {
    ok: allBlocked.length === 0,
    blocked: Array.from(new Set(allBlocked)),
    flagged: Array.from(new Set(allFlagged)),
    perField,
  };
}
