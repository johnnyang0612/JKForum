"use client";

import { MessageSquare } from "lucide-react";
import { ConversationList } from "@/components/message/conversation-list";

export function MessagesInbox() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-xl border bg-card">
        {/* Left: Conversation list */}
        <div className="w-full border-r sm:w-80 lg:w-96">
          <ConversationList />
        </div>

        {/* Right: Empty state */}
        <div className="hidden flex-1 sm:flex sm:flex-col sm:items-center sm:justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">選擇對話</h3>
            <p className="max-w-xs text-sm text-muted-foreground">
              從左側選擇一個對話，或發起新的私訊
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
