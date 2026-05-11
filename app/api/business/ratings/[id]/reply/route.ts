import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { moderateAll } from "@/lib/content-moderation";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function ownsRating(userId: string, ratingId: string) {
  const r = await db.businessAdRating.findUnique({
    where: { id: ratingId },
    select: { adId: true },
  });
  if (!r) return null;
  const ad = await db.businessAd.findUnique({
    where: { id: r.adId },
    select: { merchantId: true },
  });
  if (!ad || ad.merchantId !== userId) return null;
  return { adId: r.adId };
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const owned = await ownsRating(session.user.id, params.id);
  if (!owned) return NextResponse.json({ error: "非該廣告擁有者" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const reply = String(body.reply ?? "").trim().slice(0, 500);
  if (!reply) return NextResponse.json({ error: "回覆不可為空" }, { status: 400 });

  const mod = await moderateAll({ reply });
  if (!mod.ok) {
    return NextResponse.json({ error: `回覆含違禁詞：${mod.blocked.join("、")}` }, { status: 400 });
  }

  await db.businessAdRating.update({
    where: { id: params.id },
    data: { merchantReply: reply, merchantRepliedAt: new Date() },
  });

  revalidatePath(`/listing/ad/${owned.adId}`);
  revalidatePath("/business/ratings");

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const owned = await ownsRating(session.user.id, params.id);
  if (!owned) return NextResponse.json({ error: "非該廣告擁有者" }, { status: 403 });

  await db.businessAdRating.update({
    where: { id: params.id },
    data: { merchantReply: null, merchantRepliedAt: null },
  });

  revalidatePath(`/listing/ad/${owned.adId}`);
  revalidatePath("/business/ratings");

  return NextResponse.json({ ok: true });
}
