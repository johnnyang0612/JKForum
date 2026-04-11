"use client";

import { useTransition } from "react";
import { toggleAdStatus } from "@/lib/actions/ad-actions";

interface AdStatusToggleProps {
  adId: string;
  isActive: boolean;
}

export function AdStatusToggle({ adId, isActive }: AdStatusToggleProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await toggleAdStatus(adId);
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
    >
      {isPending ? "處理中..." : isActive ? "停用" : "啟用"}
    </button>
  );
}
