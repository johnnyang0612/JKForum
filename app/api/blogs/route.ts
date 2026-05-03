import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canDo } from "@/lib/user-groups";
import { moderateAll } from "@/lib/content-moderation";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const authorId = url.searchParams.get("author");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = 20;

  const where = {
    isPublic: true,
    ...(authorId ? { authorId } : {}),
  };
  const [items, total] = await Promise.all([
    db.blog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profile: { select: { avatarUrl: true } },
          },
        },
      },
    }),
    db.blog.count({ where }),
  ]);

  return NextResponse.json({ success: true, items, total, page, pageSize });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { readPermission: true },
  });
  if (!canDo(me?.readPermission ?? 10, "CREATE_BLOG")) {
    return NextResponse.json(
      { success: false, error: "閱讀權限需 ≥ 30 才能建日誌" },
      { status: 403 }
    );
  }
  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim().slice(0, 200);
  const content = String(body.content ?? "").trim();
  const coverUrl = body.coverUrl ? String(body.coverUrl) : null;
  const isPublic = body.isPublic !== false;
  const status = body.status === "DRAFT" ? "DRAFT" : "PUBLISHED";
  const hasVideo = !!body.hasVideo;
  // PRD 強制：日誌「發布」必須綁定店家；草稿不檢查
  const adId = body.adId ? String(body.adId) : null;
  const rating = body.rating == null ? null : Math.max(1, Math.min(5, Math.floor(Number(body.rating))));

  if (!title || !content) {
    return NextResponse.json(
      { success: false, error: "標題與內容必填" },
      { status: 400 }
    );
  }
  if (status === "PUBLISHED" && !adId) {
    return NextResponse.json(
      { success: false, error: "發布需綁定店家廣告（避免假評）" },
      { status: 400 }
    );
  }

  let ad = null;
  if (adId) {
    ad = await db.businessAd.findUnique({
      where: { id: adId },
      select: { id: true, status: true, ratingAvg: true, ratingCount: true },
    });
    if (!ad) return NextResponse.json({ success: false, error: "綁定的廣告不存在" }, { status: 404 });
    if (status === "PUBLISHED" && ad.status !== "ACTIVE" && ad.status !== "EXPIRED") {
      return NextResponse.json({ success: false, error: "綁定的廣告未上架" }, { status: 400 });
    }
  }

  // 敏感詞過濾
  const mod = await moderateAll({ title, content });
  if (!mod.ok) {
    return NextResponse.json({
      success: false,
      error: `內容含違禁詞：${mod.blocked.join("、")}`,
    }, { status: 400 });
  }

  const blog = await db.$transaction(async (tx) => {
    const b = await tx.blog.create({
      data: {
        authorId: session.user.id, title, content, coverUrl, isPublic,
        status, hasVideo,
      },
    });
    if (ad) {
      await tx.blogStoreLink.create({
        data: { blogId: b.id, adId: ad.id },
      });
      if (rating != null && status === "PUBLISHED") {
        const newCount = ad.ratingCount + 1;
        const newAvg = (ad.ratingAvg * ad.ratingCount + rating) / newCount;
        await tx.businessAd.update({
          where: { id: ad.id },
          data: { ratingCount: newCount, ratingAvg: Math.round(newAvg * 100) / 100 },
        });
      }
    }
    return b;
  });
  return NextResponse.json({ success: true, blog });
}
