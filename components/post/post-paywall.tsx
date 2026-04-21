"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Coins,
  Crown,
  MessageCircle,
  Award,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { AccessReason } from "@/lib/post-access";

interface Props {
  postId: string;
  reason: AccessReason;
  requiredCoins?: number;
  requiredPermission?: number;
  currentPermission?: number;
}

export function PostPaywall({
  postId,
  reason,
  requiredCoins,
  requiredPermission,
  currentPermission,
}: Props) {
  const router = useRouter();
  const [unlocking, setUnlocking] = useState(false);

  const unlock = async () => {
    setUnlocking(true);
    try {
      const r = await fetch(`/api/posts/${postId}/unlock`, { method: "POST" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "解鎖失敗");
      toast.success(`已解鎖！扣除 ${data.paidCoins} 金幣`);
      router.refresh();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setUnlocking(false);
    }
  };

  let icon = <Lock className="h-12 w-12 text-muted-foreground" />;
  let title = "內容已鎖定";
  let desc = "無法查看";
  let action: React.ReactNode = null;

  switch (reason) {
    case "login_required":
      icon = <LogIn className="h-12 w-12 text-primary" />;
      title = "請先登入";
      desc = "登入後才能檢視此文章的完整內容";
      action = (
        <Link href="/login">
          <Button size="lg">前往登入</Button>
        </Link>
      );
      break;

    case "not_replied":
      icon = <MessageCircle className="h-12 w-12 text-emerald-500" />;
      title = "回覆後可見";
      desc = "此為隱藏文 — 留下你的回覆即可解鎖完整內容";
      action = (
        <p className="text-xs text-muted-foreground">
          ↓ 往下捲動至回覆區，留言後重新整理即可
        </p>
      );
      break;

    case "not_unlocked":
      icon = <Coins className="h-12 w-12 text-amber-500" />;
      title = `付費內容 — ${requiredCoins ?? "?"} 金幣`;
      desc = "花費金幣永久解鎖此文章，80% 金幣將歸給作者";
      action = (
        <Button size="lg" onClick={unlock} loading={unlocking}>
          <Coins className="mr-2 h-5 w-5" />
          花 {requiredCoins} 金幣解鎖
        </Button>
      );
      break;

    case "vip_required":
      icon = <Crown className="h-12 w-12 text-yellow-500" />;
      title = "VIP 專屬內容";
      desc = "升級為 VIP 會員即可享受所有 VIP 文章";
      action = (
        <Link href="/vip">
          <Button size="lg" variant="default">
            升級 VIP
          </Button>
        </Link>
      );
      break;

    case "permission_too_low":
      icon = <Award className="h-12 w-12 text-violet-500" />;
      title = `閱讀權限不足`;
      desc = `此文章需要閱讀權限 ${requiredPermission}，你目前的權限為 ${currentPermission ?? 0}`;
      action = (
        <p className="text-xs text-muted-foreground">
          提升等級即可解鎖 — 多發文、多互動累積名聲
        </p>
      );
      break;

    case "private":
      title = "私密文章";
      desc = "作者已將此文設為僅自己可見";
      break;
  }

  return (
    <div className="rounded-xl border-2 border-dashed bg-gradient-to-br from-muted/50 to-muted/20 p-8 text-center space-y-4">
      <div className="flex justify-center">{icon}</div>
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
