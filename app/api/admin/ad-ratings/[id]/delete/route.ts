import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { logAdminAction } from "@/lib/admin-log";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  const r = await db.businessAdRating.findUnique({ where: { id: params.id } });
  if (!r) return NextResponse.redirect(new URL("/admin/ad-ratings", req.url));

  await db.businessAdRating.delete({ where: { id: params.id } });

  // 重算 ratingAvg / Count
  const agg = await db.businessAdRating.aggregate({
    where: { adId: r.adId },
    _avg: { score: true },
    _count: true,
  });
  await db.businessAd.update({
    where: { id: r.adId },
    data: { ratingAvg: agg._avg.score ?? 0, ratingCount: agg._count },
  });

  await logAdminAction({
    adminId: admin.id, action: "SETTINGS_CHANGE",
    targetType: "BusinessAdRating", targetId: params.id,
    detail: `[AD_RATING_DELETE] ad=${r.adId} user=${r.userId} score=${r.score}`,
  });

  revalidatePath("/admin/ad-ratings");
  revalidatePath(`/listing/ad/${r.adId}`);
  return NextResponse.redirect(new URL("/admin/ad-ratings", req.url));
}
