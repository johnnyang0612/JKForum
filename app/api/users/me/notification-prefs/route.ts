import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["REPLY", "LIKE", "FOLLOW", "MENTION", "SYSTEM", "REPORT_RESULT", "LEVEL_UP", "ACHIEVEMENT"] as const;
const VALID_CHANNELS = ["site", "email", "line", "push"] as const;

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const raw = body.prefs ?? {};
  if (typeof raw !== "object" || raw === null) {
    return NextResponse.json({ error: "格式錯誤" }, { status: 400 });
  }

  // sanitize：只保留合法 type + channel + boolean
  const clean: Record<string, Record<string, boolean>> = {};
  for (const [t, ch] of Object.entries(raw)) {
    if (!(VALID_TYPES as readonly string[]).includes(t)) continue;
    if (typeof ch !== "object" || ch === null) continue;
    const channels: Record<string, boolean> = {};
    for (const [c, v] of Object.entries(ch as Record<string, unknown>)) {
      if (!(VALID_CHANNELS as readonly string[]).includes(c)) continue;
      channels[c] = !!v;
    }
    if (Object.keys(channels).length > 0) clean[t] = channels;
  }

  // upsert profile
  await db.userProfile.upsert({
    where: { userId: session.user.id },
    update: { notificationPrefs: clean },
    create: { userId: session.user.id, notificationPrefs: clean },
  });

  return NextResponse.json({ ok: true });
}
