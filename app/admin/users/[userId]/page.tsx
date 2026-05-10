"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { banUser, unbanUser, muteUser, unmuteUser, adjustPoints } from "@/lib/actions/admin-actions";
import useSWR from "swr";
import { UserIpInfo } from "@/components/admin/user-ip-info";
import { UserCredentialsPanel } from "@/components/admin/user-credentials-panel";
import { UserWalletPanel } from "@/components/admin/user-wallet-panel";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminUserDetailPage({ params }: { params: { userId: string } }) {
  const router = useRouter();
  const { data, isLoading } = useSWR(`/api/admin/users?userId=${params.userId}`, fetcher);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [pointType, setPointType] = useState("COINS");
  const [pointAmount, setPointAmount] = useState("");
  const [pointReason, setPointReason] = useState("");

  const user = data?.data;

  function handleAction(action: "ban" | "unban" | "mute" | "unmute") {
    const reason = action === "ban" || action === "mute" ? prompt("請輸入原因：") : undefined;
    startTransition(async () => {
      let result;
      switch (action) {
        case "ban": result = await banUser(params.userId, reason || undefined); break;
        case "unban": result = await unbanUser(params.userId); break;
        case "mute": result = await muteUser(params.userId, reason || undefined); break;
        case "unmute": result = await unmuteUser(params.userId); break;
      }
      if (result?.success) {
        setMessage("操作成功");
        router.refresh();
      } else {
        setMessage(result?.error || "操作失敗");
      }
    });
  }

  function handleAdjustPoints() {
    if (!pointAmount || !pointReason) return;
    startTransition(async () => {
      const result = await adjustPoints(
        params.userId,
        pointType as "REPUTATION" | "COINS" | "PLATINUM",
        Number(pointAmount),
        pointReason
      );
      if (result?.success) {
        setMessage("積分調整成功");
        setPointAmount("");
        setPointReason("");
        router.refresh();
      } else {
        setMessage(result?.error || "操作失敗");
      }
    });
  }

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      {[...Array(6)].map((_, i) => <div key={i} className="h-10 rounded bg-muted" />)}
    </div>;
  }

  if (!user) {
    return <p className="text-muted-foreground">用戶不存在</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">用戶管理 - {user.displayName}</h1>

      {message && (
        <div className="rounded-lg border bg-muted p-3 text-sm">{message}</div>
      )}

      {/* User info */}
      <div className="rounded-lg border bg-card p-6 space-y-3">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><span className="text-sm text-muted-foreground">用戶名：</span> <strong>{user.username}</strong></div>
          <div><span className="text-sm text-muted-foreground">Email：</span> <strong>{user.email}</strong></div>
          <div><span className="text-sm text-muted-foreground">角色：</span> <Badge>{user.role}</Badge></div>
          <div><span className="text-sm text-muted-foreground">狀態：</span> <Badge variant={user.status === "ACTIVE" ? "success" : "destructive"}>{user.status}</Badge></div>
          <div><span className="text-sm text-muted-foreground">加入時間：</span> {new Date(user.createdAt).toLocaleDateString("zh-TW")}</div>
          <div><span className="text-sm text-muted-foreground">等級：</span> {user.points?.level ?? "N/A"}</div>
        </div>
      </div>

      {/* IP 風控 */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h3 className="font-semibold">🛡️ IP 風控</h3>
        <UserIpInfo userId={params.userId} />
      </div>

      {/* 帳號憑證（改 email / 重設密碼） */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h3 className="font-semibold">🔐 帳號憑證</h3>
        <UserCredentialsPanel userId={params.userId} email={user.email} />
      </div>

      {/* 業者錢包 / 交易紀錄（若為業者才顯示完整資料） */}
      {user.userType === "BUSINESS" && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h3 className="font-semibold">💰 業者錢包</h3>
          <UserWalletPanel userId={params.userId} />
        </div>
      )}

      {/* Actions */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h3 className="font-semibold">用戶操作</h3>
        <div className="flex flex-wrap gap-2">
          {user.status === "ACTIVE" && (
            <>
              <Button variant="outline" onClick={() => handleAction("mute")} loading={isPending}>禁言</Button>
              <Button variant="destructive" onClick={() => handleAction("ban")} loading={isPending}>封鎖</Button>
            </>
          )}
          {user.status === "BANNED" && (
            <Button variant="outline" onClick={() => handleAction("unban")} loading={isPending}>解除封鎖</Button>
          )}
          {user.status === "MUTED" && (
            <Button variant="outline" onClick={() => handleAction("unmute")} loading={isPending}>解除禁言</Button>
          )}
        </div>
      </div>

      {/* Points adjustment */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h3 className="font-semibold">積分調整</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="積分類型"
            options={[
              { value: "REPUTATION", label: "名聲" },
              { value: "COINS", label: "金幣" },
              { value: "PLATINUM", label: "白金幣" },
            ]}
            value={pointType}
            onChange={(e) => setPointType(e.target.value)}
          />
          <Input
            label="數量（正數增加，負數扣除）"
            type="number"
            value={pointAmount}
            onChange={(e) => setPointAmount(e.target.value)}
            placeholder="例如：100 或 -50"
          />
          <Input
            label="原因"
            value={pointReason}
            onChange={(e) => setPointReason(e.target.value)}
            placeholder="調整原因"
          />
        </div>
        <Button onClick={handleAdjustPoints} loading={isPending} disabled={!pointAmount || !pointReason}>
          調整積分
        </Button>
      </div>
    </div>
  );
}
