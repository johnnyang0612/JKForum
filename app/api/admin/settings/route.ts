import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { logAdminAction } from "@/lib/admin-log";
import { bustSiteSettingsCache } from "@/lib/site-settings";
import { revalidatePath } from "next/cache";

const KEYS_FROM_FORM: Array<[string, string]> = [
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

export async function POST(req: NextRequest) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "未授權" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));

  await db.$transaction(
    KEYS_FROM_FORM.map(([formKey, dbKey]) => {
      let v = body[formKey];
      if (typeof v === "string") v = v.slice(0, 2000);
      return db.platformSetting.upsert({
        where: { key: dbKey },
        update: { value: v ?? null },
        create: { key: dbKey, value: v ?? null },
      });
    })
  );

  await logAdminAction({
    adminId: admin.id,
    action: "SETTINGS_CHANGE",
    targetType: "Settings",
    targetId: "site",
    detail: `[SITE_SETTINGS_UPDATE]`,
  });

  bustSiteSettingsCache();
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true });
}
