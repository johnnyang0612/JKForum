import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getPayuniEnv, payuniEnabled, buildDepositPayload, decryptCallback, verifyHash,
} from "@/lib/payuni";

const TEST_KEY = "12345678901234567890123456789012"; // 32 bytes
const TEST_IV = "1234567890123456"; // 16 bytes

describe("payuni", () => {
  let originalEnv: NodeJS.ProcessEnv;
  beforeEach(() => {
    originalEnv = { ...process.env };
  });
  afterEach(() => {
    process.env = originalEnv;
  });

  describe("env detection", () => {
    it("缺 env 時 payuniEnabled = false", () => {
      delete process.env.PAYUNI_MER_ID;
      delete process.env.PAYUNI_HASH_KEY;
      delete process.env.PAYUNI_HASH_IV;
      expect(payuniEnabled()).toBe(false);
      expect(getPayuniEnv()).toBeNull();
    });

    it("env 齊全時 payuniEnabled = true", () => {
      process.env.PAYUNI_MER_ID = "TEST123";
      process.env.PAYUNI_HASH_KEY = TEST_KEY;
      process.env.PAYUNI_HASH_IV = TEST_IV;
      expect(payuniEnabled()).toBe(true);
      const env = getPayuniEnv();
      expect(env?.merID).toBe("TEST123");
      expect(env?.endpoint).toContain("payuni.com.tw");
    });
  });

  describe("buildDepositPayload", () => {
    beforeEach(() => {
      process.env.PAYUNI_MER_ID = "TEST123";
      process.env.PAYUNI_HASH_KEY = TEST_KEY;
      process.env.PAYUNI_HASH_IV = TEST_IV;
    });

    it("正常組 payload", () => {
      const p = buildDepositPayload({
        orderId: "ORD123", amount: 1000, productName: "測試儲值",
        notifyUrl: "https://x.com/notify", returnUrl: "https://x.com/return",
        email: "test@example.com",
      });
      expect(p.url).toContain("payuni");
      expect(p.fields.MerID).toBe("TEST123");
      expect(p.fields.EncryptInfo).toBeTruthy();
      expect(p.fields.HashInfo).toMatch(/^[A-F0-9]{64}$/); // SHA256 hex uppercase
    });

    it("缺 env 時 throw", () => {
      delete process.env.PAYUNI_MER_ID;
      expect(() => buildDepositPayload({
        orderId: "X", amount: 100, productName: "x",
        notifyUrl: "x", returnUrl: "x", email: "x",
      })).toThrow("PAYUNi 未設定");
    });
  });

  describe("decryptCallback / verifyHash 對稱性", () => {
    beforeEach(() => {
      process.env.PAYUNI_MER_ID = "TEST123";
      process.env.PAYUNI_HASH_KEY = TEST_KEY;
      process.env.PAYUNI_HASH_IV = TEST_IV;
    });

    it("encrypt → decrypt 還原", () => {
      const p = buildDepositPayload({
        orderId: "RT001", amount: 500, productName: "test",
        notifyUrl: "u", returnUrl: "u", email: "a@b.c",
      });
      const decoded = decryptCallback(p.fields.EncryptInfo);
      expect(decoded.MerTradeNo).toBe("RT001");
      expect(decoded.TradeAmt).toBe("500");
    });

    it("hash 驗證正確", () => {
      const p = buildDepositPayload({
        orderId: "H1", amount: 1, productName: "x",
        notifyUrl: "u", returnUrl: "u", email: "a@b.c",
      });
      expect(verifyHash(p.fields.EncryptInfo, p.fields.HashInfo)).toBe(true);
    });

    it("hash 被竄改 → false", () => {
      const p = buildDepositPayload({
        orderId: "H2", amount: 1, productName: "x",
        notifyUrl: "u", returnUrl: "u", email: "a@b.c",
      });
      expect(verifyHash(p.fields.EncryptInfo, "0".repeat(64))).toBe(false);
    });
  });
});
