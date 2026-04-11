"use client";

import { useState, useTransition } from "react";
import { Crown, Check, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { purchaseVipAction } from "@/lib/actions/vip-actions";

const plans = [
  {
    key: "MONTHLY" as const,
    name: "月費會員",
    price: 99,
    unit: "白金幣/月",
    description: "適合想先體驗 VIP 的你",
    benefits: [
      "專屬 VIP 標識",
      "觀看 VIP 限定內容",
      "每日簽到雙倍金幣",
      "專屬勳章展示",
    ],
    tag: null,
    popular: false,
  },
  {
    key: "QUARTERLY" as const,
    name: "季費會員",
    price: 249,
    unit: "白金幣/季",
    description: "最多人選擇的方案",
    benefits: [
      "月費所有權益",
      "每月贈送置頂卡 x1",
      "暱稱專屬顏色",
      "優先客服回覆",
    ],
    tag: "最受歡迎",
    popular: true,
  },
  {
    key: "YEARLY" as const,
    name: "年費會員",
    price: 799,
    unit: "白金幣/年",
    description: "最划算的長期方案",
    benefits: [
      "季費所有權益",
      "每月贈送高亮卡 x2",
      "專屬年費勳章",
      "免費進入付費看板",
    ],
    tag: "最划算",
    popular: false,
  },
];

interface VipPlansProps {
  currentPlan?: string | null;
  platinum?: number;
}

export function VipPlans({ currentPlan, platinum = 0 }: VipPlansProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [result, setResult] = useState<{ success?: boolean; error?: string; message?: string } | null>(null);

  function handlePurchase(planKey: "MONTHLY" | "QUARTERLY" | "YEARLY") {
    setSelectedPlan(planKey);
    setResult(null);
    startTransition(async () => {
      const res = await purchaseVipAction(planKey);
      setResult(res);
      setSelectedPlan(null);
    });
  }

  return (
    <div className="space-y-6">
      {result?.error && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
          {result.error}
        </div>
      )}
      {result?.success && (
        <div className="rounded-lg border border-success/20 bg-success/5 p-4 text-sm text-success">
          {result.message}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.key;
          const canAfford = platinum >= plan.price;

          return (
            <Card
              key={plan.key}
              className={`relative overflow-hidden transition-shadow hover:shadow-lg ${
                plan.popular ? "border-primary ring-2 ring-primary/20" : ""
              }`}
            >
              {plan.tag && (
                <div className="absolute right-0 top-0">
                  <Badge className="rounded-bl-lg rounded-tr-lg rounded-tl-none rounded-br-none px-3 py-1 bg-primary text-primary-foreground">
                    {plan.tag}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-3">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="ml-1 text-sm text-muted-foreground">{plan.unit}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  disabled={isCurrentPlan || !canAfford || (isPending && selectedPlan === plan.key)}
                  onClick={() => handlePurchase(plan.key)}
                >
                  {isPending && selectedPlan === plan.key ? (
                    "處理中..."
                  ) : isCurrentPlan ? (
                    "目前方案"
                  ) : !canAfford ? (
                    "白金幣不足"
                  ) : (
                    <>
                      <Sparkles className="mr-1 h-4 w-4" />
                      立即訂閱
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
