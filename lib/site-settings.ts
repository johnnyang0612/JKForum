import { db } from "@/lib/db";

export type SiteSettings = {
  name: string;
  description: string;
  logoUrl: string;
  faviconUrl: string;
  seoTitle: string;
  seoDescription: string;
  contactEmail: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
};

const DEFAULTS: SiteSettings = {
  name: "JKForum",
  description: "綜合型社群論壇平台",
  logoUrl: "",
  faviconUrl: "",
  seoTitle: "",
  seoDescription: "",
  contactEmail: "",
  maintenanceMode: false,
  maintenanceMessage: "系統維護中，請稍後再試。",
};

const KEYS: Array<[keyof SiteSettings, string]> = [
  ["name", "site.name"],
  ["description", "site.description"],
  ["logoUrl", "site.logoUrl"],
  ["faviconUrl", "site.faviconUrl"],
  ["seoTitle", "site.seoTitle"],
  ["seoDescription", "site.seoDescription"],
  ["contactEmail", "site.contactEmail"],
  ["maintenanceMode", "site.maintenanceMode"],
  ["maintenanceMessage", "site.maintenanceMessage"],
];

// 簡易 in-memory cache，避免每個 request 都打 DB（PlatformSetting 改動少）
let cached: { value: SiteSettings; at: number } | null = null;
const TTL_MS = 60 * 1000;

export async function getSiteSettings(): Promise<SiteSettings> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  try {
    const rows = await db.platformSetting.findMany({
      where: { key: { in: KEYS.map(([, k]) => k) } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const out: SiteSettings = { ...DEFAULTS };
    for (const [field, dbKey] of KEYS) {
      const v = map[dbKey];
      if (v !== undefined && v !== null) {
        if (field === "maintenanceMode") {
          (out as Record<string, unknown>)[field] = !!v;
        } else {
          (out as Record<string, unknown>)[field] = String(v);
        }
      }
    }
    cached = { value: out, at: Date.now() };
    return out;
  } catch {
    return DEFAULTS;
  }
}

export function bustSiteSettingsCache() {
  cached = null;
}
