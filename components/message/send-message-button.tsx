"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrCreateConversation } from "@/lib/actions/message-actions";
import { cn } from "@/lib/utils/cn";

interface SendMessageButtonProps {
  targetUserId: string;
  isAuthenticated?: boolean;
  className?: string;
}

export function SendMessageButton({
  targetUserId,
  isAuthenticated = false,
  className,
}: SendMessageButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await getOrCreateConversation(targetUserId);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.conversationId) {
        router.push(`/messages/${result.conversationId}`);
      }
    });
  }

  if (!isAuthenticated) return null;

  return (
    <div className={cn("inline-flex flex-col", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        loading={isPending}
      >
        <MessageCircle className="h-4 w-4 mr-1" />
        發送私訊
      </Button>
      {error && (
        <span className="mt-1 text-xs text-danger">{error}</span>
      )}
    </div>
  );
}
