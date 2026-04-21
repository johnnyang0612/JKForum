"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UserCheck, UserX, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Relation = "none" | "outgoing" | "incoming" | "accepted";

interface Props {
  userId: string;
  initial: Relation;
  authenticated: boolean;
}

export function FriendButton({ userId, initial, authenticated }: Props) {
  const router = useRouter();
  const [rel, setRel] = useState<Relation>(initial);
  const [loading, setLoading] = useState(false);

  const req = async (
    method: "POST" | "DELETE",
    path = `/api/friends/${userId}`
  ) => {
    setLoading(true);
    try {
      const r = await fetch(path, { method });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "操作失敗");
      return data;
    } catch (e: unknown) {
      toast.error((e as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!authenticated) {
      toast.error("請先登入");
      router.push("/login");
      return;
    }
    const data = await req("POST");
    if (!data) return;
    if (data.accepted) {
      setRel("accepted");
      toast.success("已成為好友");
    } else if (data.status === "PENDING") {
      setRel("outgoing");
      toast.success("已送出好友邀請");
    }
    router.refresh();
  };

  const cancel = async () => {
    const data = await req("DELETE");
    if (!data) return;
    setRel("none");
    toast.success("已取消");
    router.refresh();
  };

  const accept = async () => {
    const data = await req("POST", `/api/friends/${userId}/accept`);
    if (!data) return;
    setRel("accepted");
    toast.success("已接受好友邀請");
    router.refresh();
  };

  const unfriend = async () => {
    if (!confirm("確定要刪除好友？")) return;
    const data = await req("DELETE");
    if (!data) return;
    setRel("none");
    toast.success("已解除好友關係");
    router.refresh();
  };

  if (rel === "accepted") {
    return (
      <Button variant="outline" size="sm" onClick={unfriend} loading={loading}>
        <UserCheck className="h-4 w-4 mr-1" />
        好友
      </Button>
    );
  }
  if (rel === "outgoing") {
    return (
      <Button variant="outline" size="sm" onClick={cancel} loading={loading}>
        <Clock className="h-4 w-4 mr-1" />
        待回應 — 取消
      </Button>
    );
  }
  if (rel === "incoming") {
    return (
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={accept} loading={loading}>
          <UserCheck className="h-4 w-4 mr-1" />
          接受
        </Button>
        <Button variant="outline" size="sm" onClick={cancel} loading={loading}>
          <UserX className="h-4 w-4 mr-1" />
          拒絕
        </Button>
      </div>
    );
  }
  return (
    <Button size="sm" onClick={send} loading={loading}>
      <UserPlus className="h-4 w-4 mr-1" />
      加好友
    </Button>
  );
}
