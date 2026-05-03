"use client";

import { useState } from "react";
import { Heart, Phone, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AdViewerClient({ adId, initialFav }: { adId: string; initialFav: boolean }) {
  const router = useRouter();
  const [fav, setFav] = useState(initialFav);
  const [busy, setBusy] = useState(false);

  async function toggleFav() {
    setBusy(true);
    try {
      const res = await fetch(`/api/business/ads/${adId}/favorite`, { method: "POST" });
      const j = await res.json();
      if (j.success) {
        setFav(j.faved);
        toast.success(j.faved ? "已加入收藏" : "已取消收藏");
        router.refresh();
      } else if (j.needLogin) {
        toast.error("請先登入");
        router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      } else toast.error(j.error);
    } finally { setBusy(false); }
  }

  function share() {
    if (navigator.share) {
      navigator.share({ title: document.title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("已複製連結");
    }
  }

  function contact() {
    fetch(`/api/business/ads/${adId}/contact`, { method: "POST" }).catch(() => {});
    toast.info("業者聯絡資訊請在介紹中查看");
  }

  return (
    <div className="flex gap-2">
      <Button variant={fav ? "default" : "outline"} onClick={toggleFav} disabled={busy} className="flex-1">
        <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
        {fav ? "已收藏" : "收藏"}
      </Button>
      <Button variant="outline" onClick={contact} className="flex-1">
        <Phone className="h-4 w-4" /> 聯絡
      </Button>
      <Button variant="outline" size="icon" onClick={share}>
        <Share2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
