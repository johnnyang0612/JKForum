"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, HeartOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Props {
  forumId: string;
  initialFollowing: boolean;
  authenticated: boolean;
}

export function ForumFollowButton({
  forumId,
  initialFollowing,
  authenticated,
}: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!authenticated) {
      toast.error("請先登入");
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`/api/forums/${forumId}/follow`, { method: "POST" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "操作失敗");
      setFollowing(data.following);
      toast.success(data.following ? "已追蹤此看板" : "已取消追蹤");
      router.refresh();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant={following ? "outline" : "default"}
      onClick={toggle}
      loading={loading}
    >
      {following ? (
        <>
          <HeartOff className="h-4 w-4 mr-1" />
          已追蹤
        </>
      ) : (
        <>
          <Heart className="h-4 w-4 mr-1" />
          追蹤
        </>
      )}
    </Button>
  );
}
