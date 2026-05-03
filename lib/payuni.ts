/**
 * PAYUNi (統一金流) 整合 — 約定授權 + 幕後扣款
 * 文件：https://www.payuni.com.tw/docs/web/atm
 *
 * 缺少環境變數時，整合模組會 throw，呼叫端要 fallback demo 模式。
 */
import crypto from "crypto";

export type PayuniEnv = {
  merID: string;
  hashKey: string;
  hashIV: string;
  endpoint: string;
};

export function getPayuniEnv(): PayuniEnv | null {
  const merID = process.env.PAYUNI_MER_ID;
  const hashKey = process.env.PAYUNI_HASH_KEY;
  const hashIV = process.env.PAYUNI_HASH_IV;
  if (!merID || !hashKey || !hashIV) return null;
  return {
    merID,
    hashKey,
    hashIV,
    endpoint: process.env.PAYUNI_ENDPOINT
      ?? "https://sandbox-api.payuni.com.tw/api/upgateway",
  };
}

export function payuniEnabled(): boolean {
  return getPayuniEnv() !== null;
}

/**
 * AES-256-CBC + base64url 加密 (PAYUNi 規範)
 */
function aesEncrypt(plain: string, key: string, iv: string) {
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key, "utf8"), Buffer.from(iv, "utf8"));
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return enc.toString("hex").toUpperCase();
}

function aesDecrypt(hex: string, key: string, iv: string) {
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key, "utf8"), Buffer.from(iv, "utf8"));
  const dec = Buffer.concat([decipher.update(Buffer.from(hex, "hex")), decipher.final()]);
  return dec.toString("utf8");
}

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex").toUpperCase();
}

/**
 * 建立信用卡儲值 payload — 回傳 form data + endpoint URL，前端 POST 到 PAYUNi
 */
export function buildDepositPayload(opts: {
  orderId: string;          // 商家訂單編號
  amount: number;           // TWD
  productName: string;
  notifyUrl: string;        // PAYUNi 幕後通知
  returnUrl: string;        // 用戶付完款瀏覽器跳回
  email: string;
}): { url: string; fields: Record<string, string> } {
  const env = getPayuniEnv();
  if (!env) throw new Error("PAYUNi 未設定");

  const params: Record<string, string | number> = {
    MerID: env.merID,
    Timestamp: Math.floor(Date.now() / 1000),
    Version: "1.0",
    MerTradeNo: opts.orderId,
    TradeAmt: opts.amount,
    ProdDesc: opts.productName.slice(0, 50),
    UsrMail: opts.email,
    NotifyURL: opts.notifyUrl,
    ReturnURL: opts.returnUrl,
    API_TYPE: "1", // 信用卡
  };
  const queryStr = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");

  const encryptInfo = aesEncrypt(queryStr, env.hashKey, env.hashIV);
  const hashInfo = sha256(`HashKey=${env.hashKey}&${encryptInfo}&HashIV=${env.hashIV}`);

  return {
    url: env.endpoint,
    fields: {
      MerID: env.merID,
      Version: "1.0",
      EncryptInfo: encryptInfo,
      HashInfo: hashInfo,
    },
  };
}

/**
 * 解密 PAYUNi callback (NotifyURL 收到的 EncryptInfo)
 */
export function decryptCallback(encryptInfo: string): Record<string, string> {
  const env = getPayuniEnv();
  if (!env) throw new Error("PAYUNi 未設定");
  const decrypted = aesDecrypt(encryptInfo, env.hashKey, env.hashIV);
  const out: Record<string, string> = {};
  for (const part of decrypted.split("&")) {
    const [k, v] = part.split("=");
    if (k) out[k] = decodeURIComponent(v ?? "");
  }
  return out;
}

export function verifyHash(encryptInfo: string, hashInfo: string): boolean {
  const env = getPayuniEnv();
  if (!env) return false;
  const expect = sha256(`HashKey=${env.hashKey}&${encryptInfo}&HashIV=${env.hashIV}`);
  return expect === hashInfo;
}
