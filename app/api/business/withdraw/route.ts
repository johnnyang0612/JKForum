import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
const MIN = 1000;
const FEE = 30;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const amount = Math.floor(Number(body.amount));
  const bankCode = String(body.bankCode ?? "").trim();
  const bankAccount = String(body.bankAccount ?? "").replace(/[^0-9]/g, "");
  const bankAccountName = String(body.bankAccountName ?? "").trim();

  if (!amount || amount < MIN) return NextResponse.json({ success: false, error: `最少 NT$ ${MIN}` }, { status: 400 });
  if (!/^\d{3}$/.test(bankCode)) return NextResponse.json({ success: false, error: "銀行代碼錯" }, { status: 400 });
  if (bankAccount.length < 6) return NextResponse.json({ success: false, error: "帳號無效" }, { status: 400 });
  if (!bankAccountName) return NextResponse.json({ success: false, error: "缺戶名" }, { status: 400 });

  const wallet = await db.businessWallet.findUnique({ where: { merchantId: session.user.id } });
  if (!wallet) return NextResponse.json({ success: false, error: "無錢包" }, { status: 400 });
  if (wallet.balance < amount + FEE) return NextResponse.json({ success: false, error: "餘額不足" }, { status: 400 });

  // 凍結金額：扣下手續費 + 提現額
  await db.$transaction(async (tx) => {
    const w = await tx.businessWallet.update({
      where: { merchantId: session.user.id },
      data: { balance: { decrement: amount + FEE } },
    });
    const wr = await tx.withdrawalRequest.create({
      data: {
        merchantId: session.user.id,
        amount, bankCode, bankAccount, bankAccountName,
        status: "PENDING",
      },
    });
    await tx.businessWalletTx.create({
      data: {
        merchantId: session.user.id,
        type: "WITHDRAWAL",
        amount: -(amount + FEE),
        balance: w.balance,
        relatedId: wr.id,
        note: `提現申請 (含手續費 ${FEE})`,
      },
    });
  });

  return NextResponse.json({ success: true });
}
