"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { MessageSquarePlus, Inbox } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ConversationItem, type ConversationItemData } from "./conversation-item";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ConversationListProps {
  activeConversationId?: string;
}

export function ConversationList({ activeConversationId }: ConversationListProps) {
  const { data: session } = useSession();
  const { data, error, isLoading } = useSWR<{
    success: boolean;
    data: ConversationItemData[];
  }>("/api/messages", fetcher, {
    refreshInterval: 10000,
  });

  const conversations = data?.data || [];

  if (isLoading) {
    return <LoadingSpinner text="載入對話中..." />;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        載入失敗，請重新整理
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-bold">私訊</h2>
        <Link href="/messages/new">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MessageSquarePlus className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-1 py-1">
        {conversations.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="沒有對話"
            description="開始與其他用戶私訊吧"
            action={{
              label: "發起新對話",
              href: "/messages/new",
            }}
            className="py-16"
          />
        ) : (
          <div className="space-y-0.5">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConversationId}
                currentUserId={session?.user?.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
