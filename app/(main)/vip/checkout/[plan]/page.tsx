import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MockCheckout } from "./mock-checkout";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "VIP 結帳" };

const PLANS: Record<string, { label: string; price: number; duration: string; extras: string[] }> = {
  MONTHLY:   { label: "VIP 月卡",   price: 99,  duration: "1 個月",  extras: ["專屬 VIP 標識", "雙倍簽到獎勵", "VIP 限定內容", "專屬勳章"] },
  QUARTERLY: { label: "VIP 季卡",   price: 249, duration: "3 個月",  extras: ["月卡全部權益", "每月贈道具卡", "優先客服"] },
  YEARLY:    { label: "VIP 年卡",   price: 799, duration: "12 個月", extras: ["季卡全部權益", "廣告減免 100%", "生日禮包"] },
};

interface Props {
  params: { plan: string };
}

export default async function VipCheckoutPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=/vip");

  const plan = PLANS[params.plan];
  if (!plan) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <MockCheckout
        planKey={params.plan}
        label={plan.label}
        price={plan.price}
        duration={plan.duration}
        extras={plan.extras}
      />
    </div>
  );
}
