import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkAndAwardMedalsSafe } from "@/lib/medal-engine";

const PLANS = {
  MONTHLY:   { duration: 30,  price: 99,  label: "月卡" },
  QUARTERLY: { duration: 90,  price: 249, label: "季卡" },
  YEARLY:    { duration: 365, price: 799, label: "年卡" },
} as const;

type PlanKey = keyof typeof PLANS;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { plan?: string };
  const planKey = body.plan as PlanKey;
  if (!planKey || !(planKey in PLANS)) {
    return NextResponse.json({ error: "方案無效" }, { status: 400 });
  }

  const plan = PLANS[planKey];
  const existingVip = await db.vipSubscription.findFirst({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
      endDate: { gt: new Date() },
    },
  });

  const startDate = existingVip ? existingVip.endDate : new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.duration);

  const sub = await db.vipSubscription.create({
    data: {
      userId: session.user.id,
      plan: planKey,
      startDate,
      endDate,
      status: "ACTIVE",
    },
  });

  // Trigger VIP medal award
  void checkAndAwardMedalsSafe(session.user.id);

  return NextResponse.json({
    success: true,
    subscriptionId: sub.id,
    plan: planKey,
    price: plan.price,
    label: plan.label,
    endDate,
  });
}
