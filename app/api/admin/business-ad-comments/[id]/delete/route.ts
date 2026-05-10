import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { logAdminAction } from "@/lib/admin-log";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.redirect(new URL("/admin", _req.url));
  }

  const c = await db.businessAdComment.findUnique({ where: { id: params.id }, select: { adId: true } });
  await db.businessAdComment.delete({ where: { id: params.id } });
  await logAdminAction({
    adminId: admin.id, action: "SETTINGS_CHANGE",
    targetType: "BusinessAdComment", targetId: params.id, detail: "[BIZ_AD_COMMENT_DELETE]",
  });

  if (c?.adId) revalidatePath(`/listing/ad/${c.adId}`);
  revalidatePath("/admin/business-ad-comments");
  return NextResponse.redirect(new URL("/admin/business-ad-comments", _req.url));
}
