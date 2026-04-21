import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { randomBytes } from "crypto";

export interface MfaSetup {
  secret: string;
  otpauth: string;
  qrDataUrl: string;
}

/** Generate a new TOTP secret + QR code data URL for onboarding. */
export async function generateMfaSetup(
  userEmail: string,
  issuer = "JKForum"
): Promise<MfaSetup> {
  const secret = speakeasy.generateSecret({
    name: `${issuer}:${userEmail}`,
    issuer,
    length: 20,
  });

  const otpauth = secret.otpauth_url || "";
  const qrDataUrl = await QRCode.toDataURL(otpauth, { width: 256, margin: 1 });

  return {
    secret: secret.base32,
    otpauth,
    qrDataUrl,
  };
}

/** Verify a 6-digit TOTP code against a stored base32 secret. */
export function verifyTotp(secret: string, token: string): boolean {
  if (!secret || !token) return false;
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token: token.trim().replace(/\s/g, ""),
    window: 1,
  });
}

/** Generate 10 single-use backup codes (8 chars, alphanumeric upper). */
export function generateBackupCodes(n = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < n; i++) {
    const raw = randomBytes(6).toString("base64").replace(/[+/=]/g, "");
    codes.push(raw.slice(0, 8).toUpperCase());
  }
  return codes;
}

/** Consume a backup code; returns true if valid & removes it from the list. */
export function consumeBackupCode(
  storedJson: string | null,
  code: string
): { ok: boolean; remaining: string | null } {
  if (!storedJson) return { ok: false, remaining: null };
  try {
    const codes: string[] = JSON.parse(storedJson);
    const normalized = code.trim().toUpperCase().replace(/\s/g, "");
    const idx = codes.indexOf(normalized);
    if (idx < 0) return { ok: false, remaining: storedJson };
    codes.splice(idx, 1);
    return { ok: true, remaining: JSON.stringify(codes) };
  } catch {
    return { ok: false, remaining: storedJson };
  }
}
