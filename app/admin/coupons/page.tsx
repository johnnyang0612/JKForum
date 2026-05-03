/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/db";
import { Ticket } from "lucide-react";
import { CouponManager } from "@/components/admin/coupon-manager";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const list = await db.couponCode.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className="space-y-4">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Ticket className="h-7 w-7 text-primary" /> 折扣碼管理
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          PERCENT(%折扣) / FIXED(固定折抵) / BONUS(加碼贈點)
        </p>
      </header>
      <CouponManager initial={list as any} />
    </div>
  );
}
