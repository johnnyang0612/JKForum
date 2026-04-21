import { cookies } from "next/headers";
import { db } from "./db";

const AGE_GATE_COOKIE = "jkf_age_gate";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24h

/**
 * Is R-18 enabled at platform level?
 */
export async function isR18Enabled(): Promise<boolean> {
  const s = await db.platformSetting.findUnique({ where: { key: "r18_enabled" } });
  return s?.value === true;
}

/**
 * Check if user has passed age gate (cookie-based, 24h).
 * For server-side checks.
 */
export async function hasPassedAgeGate(
  userId?: string | null
): Promise<boolean> {
  if (userId) {
    // Logged-in user: check their confirmed age
    const u = await db.user.findUnique({
      where: { id: userId },
      select: { ageConfirmedAt: true, birthdate: true },
    });
    if (u?.ageConfirmedAt && u.birthdate) {
      const age = yearsBetween(u.birthdate, new Date());
      if (age >= 18) return true;
    }
  }
  const cookieStore = cookies();
  const c = cookieStore.get(AGE_GATE_COOKIE);
  return c?.value === "confirmed";
}

export function setAgeGateCookie() {
  const cookieStore = cookies();
  cookieStore.set(AGE_GATE_COOKIE, "confirmed", {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

function yearsBetween(a: Date, b: Date): number {
  let years = b.getFullYear() - a.getFullYear();
  const m = b.getMonth() - a.getMonth();
  if (m < 0 || (m === 0 && b.getDate() < a.getDate())) years--;
  return years;
}

/**
 * Determine whether a request to view a R-18 resource should be allowed.
 */
export async function checkR18Access(
  userId?: string | null
): Promise<{ allowed: boolean; reason: "disabled" | "need_gate" | "ok" }> {
  const enabled = await isR18Enabled();
  if (!enabled) return { allowed: false, reason: "disabled" };
  const passed = await hasPassedAgeGate(userId);
  if (!passed) return { allowed: false, reason: "need_gate" };
  return { allowed: true, reason: "ok" };
}
