import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { logAdminAction } from "@/lib/admin-log";
import { revalidatePath } from "next/cache";

const SEV = ["INFO", "WARNING", "CRITICAL"] as const;
type Severity = (typeof SEV)[number];

export async function POST(req: NextRequest) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "未授權" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim().slice(0, 200);
  const text = String(body.body ?? "").trim().slice(0, 5000);
  const severity = (SEV as readonly string[]).includes(body.severity) ? (body.severity as Severity) : "INFO";
  const isPinned = !!body.isPinned;
  const startAt = body.startAt ? new Date(body.startAt) : null;
  const endAt = body.endAt ? new Date(body.endAt) : null;

  if (!title || !text) return NextResponse.json({ error: "標題與內容為必填" }, { status: 400 });

  const a = await db.announcement.create({
    data: { title, body: text, severity, isPinned, startAt, endAt, createdBy: admin.id },
  });

  await logAdminAction({
    adminId: admin.id,
    action: "SETTINGS_CHANGE",
    targetType: "Announcement",
    targetId: a.id,
    detail: `[ANNOUNCEMENT_CREATE] ${title}`,
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/");

  return NextResponse.json({
    data: {
      id: a.id, title: a.title, body: a.body, severity: a.severity,
      isPinned: a.isPinned,
      startAt: a.startAt?.toISOString() ?? null,
      endAt: a.endAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
    },
  });
}
