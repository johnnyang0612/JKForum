"use client";

import { useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { MessageBubble, type MessageData } from "./message-bubble";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { markAsRead } from "@/lib/actions/message-actions";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface MessageListProps {
  conversationId: string;
}

export function MessageList({ conversationId }: MessageListProps) {
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: MessageData[];
    meta: { total: number; page: number; pageSize: number; totalPages: number; hasMore: boolean };
  }>(`/api/messages/${conversationId}?page=1`, fetcher, {
    refreshInterval: 5000,
  });

  const messages = data?.data || [];

  // 自動捲動到底部
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // 初次載入或新訊息時捲動到底部
  useEffect(() => {
    if (messages.length > 0) {
      if (prevMessageCountRef.current === 0) {
        // 初次載入
        scrollToBottom("instant");
      } else if (messages.length > prevMessageCountRef.current) {
        // 有新訊息
        scrollToBottom("smooth");
      }
      prevMessageCountRef.current = messages.length;
    }
  }, [messages.length, scrollToBottom]);

  // 進入對話時標記已讀
  useEffect(() => {
    markAsRead(conversationId);
  }, [conversationId]);

  // 當 SWR 取得新資料時也標記已讀
  useEffect(() => {
    if (data?.data && data.data.length > 0) {
      markAsRead(conversationId);
    }
  }, [data, conversationId]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingSpinner text="載入訊息中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        載入失敗，請重新整理
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        開始對話吧！發送第一則訊息
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4">
      <div className="mx-auto max-w-3xl space-y-3">
        {data?.meta?.hasMore && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                // 載入更早的訊息 - 暫以重新整理替代
                mutate();
              }}
              className="text-xs text-primary hover:underline"
            >
              載入更早的訊息
            </button>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.sender.id === session?.user?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
