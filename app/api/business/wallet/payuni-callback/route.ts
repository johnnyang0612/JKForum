/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptCallback, verifyHash } from "@/lib/payuni";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData();
  const encryptInfo = String(form.get("EncryptInfo") ?? "");
  const hashInfo = String(form.get("HashInfo") ?? "");
  if (!encryptInfo || !hashInfo) {
    return NextResponse.json({ status: "INVALID" }, { status: 400 });
  }
  if (!verifyHash(encryptInfo, hashInfo)) {
    return NextResponse.json({ status: "HASH_FAIL" }, { status: 400 });
  }
  const data = decryptCallback(encryptInfo);
  const status = data.Status; // PAYUNi: SUCCESS / FAIL
  const orderId = data.MerTradeNo;
  const amount = Math.floor(Number(data.TradeAmt ?? 0));
  if (!orderId || !amount) {
    return NextResponse.json({ status: "MISSING" }, { status: 400 });
  }

  // 找 pending tx
  const pending = await db.businessWalletTx.findFirst({
    where: { relatedId: orderId, type: "ADMIN_ADJUST" },
  });
  if (!pending) return NextResponse.json({ status: "ORDER_NOT_FOUND" });
  if (status !== "SUCCESS") {
    await db.businessWalletTx.update({
      where: { id: pending.id },
      data: { note: (pending.note ?? "") + " | FAILED" },
    });
    return NextResponse.json({ status: "FAILED_RECORDED" });
  }

  // 防重複入帳
  const dup = await db.businessWalletTx.findFirst({
    where: { relatedId: orderId, type: "DEPOSIT" },
  });
  if (dup) return NextResponse.json({ status: "ALREADY_CREDITED" });

  await db.$transaction(async (tx) => {
    const w = await tx.businessWallet.upsert({
      where: { merchantId: pending.merchantId },
      create: { merchantId: pending.merchantId, balance: amount, totalDeposit: amount },
      update: { balance: { increment: amount }, totalDeposit: { increment: amount } },
    });
    await tx.businessWalletTx.create({
      data: {
        merchantId: pending.merchantId,
        type: "DEPOSIT", amount, balance: w.balance,
        relatedId: orderId, note: `PAYUNi orderId=${orderId}`,
      },
    });
    await tx.businessWalletTx.update({
      where: { id: pending.id },
      data: { note: (pending.note ?? "") + " | CONFIRMED" },
    });
  });
  return NextResponse.json({ status: "OK" });
}
