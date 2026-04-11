"use client";

import { Crown, Sparkles, Shield, Eye, Coins, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VipPlans } from "@/components/vip/vip-plans";
import { VipStatus } from "@/components/vip/vip-status";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const allBenefits = [
  {
    icon: <Crown className="h-6 w-6 text-amber-500" />,
    title: "專屬 VIP 標識",
    description: "你的暱稱旁會顯示尊貴的 VIP 徽章",
  },
  {
    icon: <Eye className="h-6 w-6 text-blue-500" />,
    title: "VIP 限定內容",
    description: "閱覽 VIP 專屬文章與隱藏看板",
  },
  {
    icon: <Coins className="h-6 w-6 text-yellow-500" />,
    title: "雙倍簽到獎勵",
    description: "每日簽到獲得雙倍金幣",
  },
  {
    icon: <Star className="h-6 w-6 text-purple-500" />,
    title: "專屬勳章",
    description: "顯示在個人檔案上的 VIP 專屬勳章",
  },
  {
    icon: <Shield className="h-6 w-6 text-green-500" />,
    title: "優先客服",
    description: "VIP 用戶的問題報告將優先處理",
  },
  {
    icon: <Sparkles className="h-6 w-6 text-orange-500" />,
    title: "每月贈品",
    description: "季費/年費會員每月獲贈道具卡",
  },
];

export default function VipPage() {
  const { data: vipData } = useSWR("/api/vip/status", fetcher);
  const { data: userData } = useSWR("/api/user/points", fetcher);

  const subscription = vipData?.data?.subscription || null;
  const currentPlan = subscription?.plan || null;
  const platinum = userData?.data?.platinum || 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
          <Crown className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold">VIP 會員</h1>
        <p className="mt-2 text-muted-foreground">
          升級為 VIP，享受獨家權益與尊貴體驗
        </p>
      </div>

      {/* Current status */}
      <VipStatus subscription={subscription} />

      {/* Benefits grid */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">VIP 專屬權益</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allBenefits.map((benefit, i) => (
            <Card key={i} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="font-medium">{benefit.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">選擇方案</h2>
        <VipPlans currentPlan={currentPlan} platinum={platinum} />
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>常見問題</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">如何獲得白金幣？</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              白金幣可透過連續簽到 30 天獎勵、完成成就任務，或在未來的儲值系統中購買。
            </p>
          </div>
          <div>
            <h4 className="font-medium">VIP 到期後會怎樣？</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              VIP 到期後權益將自動停止，但你已獲得的勳章和道具不會消失。
            </p>
          </div>
          <div>
            <h4 className="font-medium">可以中途取消嗎？</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              可以隨時取消訂閱，取消後 VIP 權益將持續到到期日為止。
            </p>
          </div>
          <div>
            <h4 className="font-medium">續訂時可以換方案嗎？</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              可以，新方案會從當前訂閱到期後開始生效。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
