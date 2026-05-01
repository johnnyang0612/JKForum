import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// 取得當前用戶持有的勳章列表（給設定頁用）
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const owned = await db.userMedal.findMany({
    where: { userId: session.user.id },
    include: { medal: true },
    orderBy: { awardedAt: "desc" },
  });
  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { representativeMedalSlug: true },
  });
  return NextResponse.json({
    success: true,
    medals: owned.map((o) => ({
      slug: o.medal.slug,
      name: o.medal.name,
      iconEmoji: o.medal.iconEmoji,
      tier: o.medal.tier,
    })),
    current: me?.representativeMedalSlug,
  });
}

// 設定代表勳章
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const slug = body.slug ? String(body.slug) : null;

  if (slug) {
    // 確認用戶有持有該勳章
    const medal = await db.medal.findUnique({ where: { slug } });
    if (!medal) {
      return NextResponse.json({ success: false, error: "勳章不存在" }, { status: 404 });
    }
    const owned = await db.userMedal.findUnique({
      where: { userId_medalId: { userId: session.user.id, medalId: medal.id } },
    });
    if (!owned) {
      return NextResponse.json({ success: false, error: "你沒持有此勳章" }, { status: 403 });
    }
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { representativeMedalSlug: slug },
  });
  return NextResponse.json({ success: true, representativeMedalSlug: slug });
}
