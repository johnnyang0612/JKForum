"use client";

import { useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import { useSWRConfig } from "swr";
import { UserAvatar } from "@/components/user/user-avatar";
import { ConversationList } from "@/components/message/conversation-list";
import { MessageList } from "@/components/message/message-list";
import { MessageInput } from "@/components/message/message-input";
import { Button } from "@/components/ui/button";

interface ConversationViewProps {
  conversationId: string;
  otherUser: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    status: string;
  };
}

export function ConversationView({
  conversationId,
  otherUser,
}: ConversationViewProps) {
  const { mutate } = useSWRConfig();

  const handleSendMessage = useCallback(
    async (content: string) => {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || "傳送失敗");
      }

      // 重新驗證訊息列表和對話列表
      mutate(`/api/messages/${conversationId}?page=1`);
      mutate("/api/messages");
    },
    [conversationId, mutate]
  );

  const isBlocked = otherUser.status === "BANNED" || otherUser.status === "DELETED";

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-xl border bg-card">
        {/* Left sidebar: conversation list (hidden on mobile) */}
        <div className="hidden w-80 border-r lg:block">
          <ConversationList activeConversationId={conversationId} />
        </div>

        {/* Right: conversation view */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <Link href="/messages" className="lg:hidden">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>

            <Link
              href={`/profile/${otherUser.id}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <UserAvatar
                src={otherUser.avatarUrl}
                fallback={otherUser.displayName}
                size="sm"
              />
              <div>
                <h3 className="text-sm font-semibold leading-tight">
                  {otherUser.displayName}
                </h3>
                <p className="text-xs text-muted-foreground">
                  @{otherUser.username}
                </p>
              </div>
            </Link>

            <div className="ml-auto">
              <Link href={`/profile/${otherUser.id}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Messages */}
          <MessageList conversationId={conversationId} />

          {/* Input */}
          {isBlocked ? (
            <div className="border-t px-4 py-3 text-center text-sm text-muted-foreground">
              此用戶已無法接收訊息
            </div>
          ) : (
            <MessageInput
              conversationId={conversationId}
              onSend={handleSendMessage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
