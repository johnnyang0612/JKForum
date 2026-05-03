import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma client
vi.mock("@/lib/db", () => ({
  db: {
    bannedWord: {
      findMany: vi.fn().mockResolvedValue([
        { word: "援交", severity: "BLOCK" },
        { word: "性交易", severity: "BLOCK" },
        { word: "全套", severity: "FLAG" },
      ]),
    },
  },
}));

import {
  moderate, moderateAsync, moderateAll, invalidateModerationCache,
} from "@/lib/content-moderation";

describe("content-moderation", () => {
  beforeEach(() => invalidateModerationCache());

  describe("moderate (sync, fallback)", () => {
    it("放行純淨文字", () => {
      const r = moderate("這是合法按摩館");
      expect(r.ok).toBe(true);
      expect(r.blocked).toEqual([]);
    });

    it("攔截違禁詞 援交", () => {
      const r = moderate("我們提供援交服務");
      expect(r.ok).toBe(false);
      expect(r.blocked).toContain("援交");
    });

    it("FLAG 詞會被替換為 ***", () => {
      const r = moderate("提供全套服務");
      expect(r.ok).toBe(true);
      expect(r.flagged).toContain("全套");
      expect(r.cleanedText).toContain("**");
    });

    it("空字串不報錯", () => {
      const r = moderate("");
      expect(r.ok).toBe(true);
    });
  });

  describe("moderateAsync (db)", () => {
    it("從 db 讀詞庫並攔截", async () => {
      const r = await moderateAsync("我提供性交易");
      expect(r.ok).toBe(false);
      expect(r.blocked).toContain("性交易");
    });

    it("FLAG 軟詞替換", async () => {
      const r = await moderateAsync("營業全套服務");
      expect(r.ok).toBe(true);
      expect(r.flagged).toContain("全套");
    });
  });

  describe("moderateAll (multi-field)", () => {
    it("聚合多 field 結果", async () => {
      const r = await moderateAll({
        title: "援交妹子",
        content: "提供性交易",
        notes: "純淨文字",
      });
      expect(r.ok).toBe(false);
      expect(r.blocked.sort()).toEqual(["援交", "性交易"].sort());
      expect(r.perField.title.ok).toBe(false);
      expect(r.perField.notes.ok).toBe(true);
    });

    it("全部乾淨 → ok=true", async () => {
      const r = await moderateAll({
        title: "高品質按摩",
        content: "舒緩腰背痠痛",
      });
      expect(r.ok).toBe(true);
      expect(r.blocked).toEqual([]);
    });
  });
});
