/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { moderateAll } from "@/lib/content-moderation";

export const dynamic = "force-dynamic";

const TIER_PRICE: Record<string, number> = {
  FREE: 0, T500: 500, T1000: 1000, T2000: 2000, T3000: 3000,
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });

  const me = await db.user.findUnique({ where: { id: session.user.id }, select: { userType: true } });
  if (me?.userType !== "BUSINESS") return NextResponse.json({ success: false, error: "非業者帳號" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const forumId = String(body.forumId ?? "");
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const city = String(body.city ?? "").trim();
  const district = String(body.district ?? "").trim();
  const tags = Array.isArray(body.tags) ? body.tags.slice(0, 10).map((s: any) => String(s).slice(0, 20)) : [];
  const coverImageUrl = body.coverImageUrl ? String(body.coverImageUrl) : null;
  const imageUrls = Array.isArray(body.imageUrls)
    ? body.imageUrls.slice(0, 8).map((s: any) => String(s).slice(0, 500))
    : [];
  const priceMin = body.priceMin == null ? null : Math.max(0, Math.floor(Number(body.priceMin)));
  const priceMax = body.priceMax == null ? null : Math.max(0, Math.floor(Number(body.priceMax)));
  const tier = String(body.tier ?? "FREE");
  const theme = body.theme ? String(body.theme) : null;

  if (!forumId || !title || title.length < 4) return NextResponse.json({ success: false, error: "標題至少 4 字" }, { status: 400 });
  if (description.length < 10) return NextResponse.json({ success: false, error: "簡介至少 10 字" }, { status: 400 });
  if (!city || !district) return NextResponse.json({ success: false, error: "缺地區" }, { status: 400 });
  if (!(tier in TIER_PRICE)) return NextResponse.json({ success: false, error: "不合法 tier" }, { status: 400 });

  // 敏感詞過濾
  const mod = await moderateAll({ title, description, tags: tags.join(" ") });
  if (!mod.ok) {
    return NextResponse.json({
      success: false,
      error: `內容含違禁詞：${mod.blocked.join("、")}。請修正後重新送出。`,
    }, { status: 400 });
  }

  const forum = await db.forum.findUnique({
    where: { id: forumId },
    select: { id: true, allowPaidListing: true, themeCategoriesJson: true, forceThemeCategory: true },
  });
  if (!forum) return NextResponse.json({ success: false, error: "版區不存在" }, { status: 404 });
  if (!forum.allowPaidListing) return NextResponse.json({ success: false, error: "該版區未開放付費刊登" }, { status: 400 });

  if (forum.forceThemeCategory) {
    const themes = (forum.themeCategoriesJson as string[] | null) ?? [];
    if (!theme || !themes.includes(theme)) {
      return NextResponse.json({ success: false, error: `請選主題（${themes.join("/")}）` }, { status: 400 });
    }
  }

  const tags2 = theme ? Array.from(new Set([theme, ...tags])) : tags;
  const price = TIER_PRICE[tier];

  // 扣款 + 建立
  const result = await db.$transaction(async (tx) => {
    if (price > 0) {
      const wallet = await tx.businessWallet.findUnique({ where: { merchantId: session.user.id } });
      if (!wallet || wallet.balance < price) throw new Error("INSUFFICIENT_BALANCE");

      const w = await tx.businessWallet.update({
        where: { merchantId: session.user.id },
        data: { balance: { decrement: price }, totalSpent: { increment: price } },
      });

      const ad = await tx.businessAd.create({
        data: {
          merchantId: session.user.id, forumId, title, description, city, district,
          tags: tags2, coverImageUrl, imageUrls: imageUrls as any,
          priceMin, priceMax,
          tier: tier as any, tierAmountTwd: price,
          status: "PENDING",
        },
      });

      await tx.businessWalletTx.create({
        data: {
          merchantId: session.user.id, type: "AD_PAYMENT", amount: -price,
          balance: w.balance, relatedId: ad.id, note: `刊登扣款 [${tier}] ${title.slice(0, 20)}`,
        },
      });
      return ad;
    }
    return tx.businessAd.create({
      data: {
        merchantId: session.user.id, forumId, title, description, city, district,
        tags: tags2, coverImageUrl,
        priceMin, priceMax,
        tier: "FREE", tierAmountTwd: 0,
        status: "PENDING",
      },
    });
  }).catch((e) => {
    if (e?.message === "INSUFFICIENT_BALANCE") return null;
    throw e;
  });

  if (!result) return NextResponse.json({ success: false, error: "餘額不足" }, { status: 400 });
  return NextResponse.json({ success: true, adId: result.id });
}
